const socket = io();

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const cameraSelect = document.getElementById('cameras')
const call = document.getElementById('call')

let myStream;
let muted = false
let cameraOff = false
let roomName;
let myPeerConnection;
let myDataChannel;

// 사용자 기기에 장착된 모든 미디어 기기를 가져올 수 있음
// 그 중에 카메라만 가져와서 option 뿌려주기
async function getCameras() {
  try {
    // 내 맥에는 6개의 미디어가 장착. 서브 모니터까지
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device)=> device.kind === "videoinput")
    /*cameras.push({
      "deviceId": "dummy",
      "kind": "videoinput",
      "label": "dummy camera",
      "groupId": "dummy"
    })*/
    const currentCamera = myStream.getVideoTracks()[0]
    cameras.forEach((camera)=> {
      const option = document.createElement('option')
      option.value = camera.deviceId
      option.innerText = camera.label
      if(currentCamera.label === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option)
    })
  }  catch(e) {
    console.log(e)
  }
}

// 디바이스의 카메라, 오디오와 연결하는 스트림생성
/*async function getMedia() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    console.log(myStream)
    myFace.srcObject = myStream
    await getCameras()
  } catch(e) {
    console.log(e)
  }
}*/

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: 'user'}  // 모바일 장치라면 전면 카메라 요청
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId : { exact: deviceId }}
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    )
    myFace.srcObject = myStream
    if(!deviceId) {
      await getCameras()
    }
  } catch(e) {
    console.log(e)
  }
}

// getMedia()

function handleMuteClick() {

  // console.log(myStream.getAudioTracks())
  // on/off
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled
  })

  if(!muted) {
    muteBtn.innerText = "Unmute";
    muted = true
  } else {
    muteBtn.innerText = "Mute"
    muted = false
  }
}

function handleCameraClick() {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled
  })
  if(!cameraOff){
    cameraBtn.innerText = "Turn Camera On"
    cameraOff = true
  } else {
    cameraBtn.innerText = "Turn Camera Off"
    cameraOff = false
  }
}

async function handleCameraChange() {
  await getMedia(cameraSelect.value)
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0]
    const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video')
    videoSender.replaceTrack(videoTrack)
  }
}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)
cameraSelect.addEventListener('input', handleCameraChange) // select box -> input, change event


const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')

// 처음에 미디어 요소들 숨겨두기
call.hidden = true

// 사용자가 입장하면 미디어 요소 불러오고 화면도 열기
async function initCall(){
  welcome.hidden = true;
  call.hidden = false;
  await getMedia()
  makeConnection()
}

async function handleWelcomeSubmit(event) {
  event.preventDefault()
  const input = welcomeForm.querySelector('input')
  await initCall()
  socket.emit('join_room', input.value)
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit)


// Socket Code
// offer 를 보내는 쪽에서 실행
socket.on('welcome', async () => {
  // WebRTC - data channel api 연결 ! 다양한 타입 데이터도 전송가능
  myDataChannel = myPeerConnection.createDataChannel('chat')
  myDataChannel.addEventListener('message', (event) => {
    console.log(event.data)
  })
  console.log('made data channel')

  // offer 객체 생성
  const offer = await myPeerConnection.createOffer()
  // console.log(offer) // RTCSessionDescription
  await myPeerConnection.setLocalDescription(offer)
  // offer 를 보내는 쪽
  console.log('sent the offer')
  socket.emit('offer', offer, roomName)
})

// offer 를 받는 쪽에서 실행
socket.on('offer', async offer => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel
    myDataChannel.addEventListener('message', event => {
      console.log(event.data)
    })
  })
  console.log('received the offer')
  myPeerConnection.setRemoteDescription(offer)

  const answer = await myPeerConnection.createAnswer()
  myPeerConnection.setLocalDescription(answer)
  socket.emit('answer', answer, roomName)
  console.log('sent the answer')
})

// answer 를 받으면서 실행
socket.on('answer', answer => {
  console.log('received the answer')
  myPeerConnection.setRemoteDescription(answer)
})


// RTC code
// peer 간의 연결에 사용할 객체를 생성
function makeConnection() {

  // RTC 연결 객체
  myPeerConnection = new RTCPeerConnection()
  myPeerConnection.addEventListener('icecandidate', handleIce)
  myPeerConnection.addEventListener('addstream', handleAddStream)
  myStream.getTracks().forEach(track => {
    // audio, video 각각 track 을 peer 간 연결에 추가
    myPeerConnection.addTrack(track, myStream)
  })
}

// icecandidate 이벤트 발생시 호출
function handleIce(data) {
  console.log('sent candidate')
  socket.emit('ice', data.candidate, roomName)
}

function handleAddStream(data){
  const peerFace = document.getElementById('peerFace')
  peerFace.srcObject = data.stream;
  // console.log('Peer\'s Stream', data.stream) // 상대방의 스트림
}

socket.on('ice', ice => {
  console.log('received candidate')
  myPeerConnection.addIceCandidate(ice)
})
