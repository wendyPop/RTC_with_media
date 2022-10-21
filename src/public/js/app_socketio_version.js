const socket = io();

const welcome = document.getElementById("welcome")
const form = welcome.querySelector('form')
const room = document.getElementById('room')

// Element hidden property
room.hidden = true
let roomName;

form.addEventListener('submit', handleRoomSubmit)

function handleRoomSubmit(event) {
  // submit event 새로고침 방지
  event.preventDefault();
  const input = form.querySelector('input')

  // 값만 보낼 수도 있고
  // socket.emit('enter_room', { payload: input.value})

  // 값 뿐만 아니라 콜백도 넣을 수 있다!
  // 이벤트명, 값, 값, 값.... 콜백함수
  // socket.emit("enter_room", input.value, () => {
  //   console.log('server is done!')
  // })

  // 서버로 이벤트 emit
  socket.emit('enter_room', input.value, showRoom)
  roomName = input.value
  input.value = "";
}

// call back
function showRoom() {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector('h3')
  h3.innerText = `Room ${roomName}`;

  // 메세지 제출 이벤트 바인딩
  // 닉네임 제출 이벤트 바인딩
  const msgForm = room.querySelector('#msg');
  const nameForm = room.querySelector('#name');
  msgForm.addEventListener('submit', handleMessageSubmit)
  nameForm.addEventListener('submit', handleNicknameSubmit)
}

function handleNicknameSubmit(event) {
  event.preventDefault()
  const input = room.querySelector('#name input')
  const value = input.value
  socket.emit("nickname", value)
  input.value = ""
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input")
  const value = input.value;
  socket.emit('new_message', value, roomName, () => {
    addMessage(`You: ${value}`);
  })
  input.value = ""
}

// 화면에 메세지 표시하기
// call back
function addMessage(message) {
  const ul = room.querySelector('ul')
  const li = document.createElement('li')
  li.innerText = message;
  ul.appendChild(li)
}

// 서버로부터 받는 이벤트들 !
socket.on('welcome', (userNickname, newCount) => {
  // addMessage(`${userNickname} arrived!`)
  const h3 = room.querySelector('h3')
  h3.innerText = `Room ${roomName} (${newCount})`
  addMessage(`${userNickname} arrived!`)
})

socket.on('bye', (userNickname, newCount) => {
  const h3 = room.querySelector('h3')
  h3.innerText = `Room ${roomName} (${newCount})`
  addMessage(`${userNickname} left! T_T`)
})

socket.on('send_message', (msg) => {
  addMessage(msg)
})

socket.on('room_change', (rooms) => {
  const roomList = welcome.querySelector('ul')
  roomList.innerHTML = ""
  if(rooms.length === 0){
    return false
  }
  rooms.forEach((room) => {
    const li = document.createElement('li')
    li.innerText = room;
    roomList.append(li)
  })
})

window.onload = () => {
  welcome.querySelector('input').focus()
}
