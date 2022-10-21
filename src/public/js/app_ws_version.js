const messageList = document.querySelector("ul")
const nickForm = document.querySelector("#nick")
const messageForm = document.querySelector("#message")
const socket = new WebSocket(`ws://${window.location.host}`)

// 화면의 소켓 핸들링
// 서버에 연결되었을 때
socket.addEventListener('open', () => {
  console.log("connected to Server")
})

// 메세지가 전달 되었을 때
// 서버 -> 클라이언트
socket.addEventListener('message', (message) => {
  // console.log("just got this:", message.data, "from the server")
  const li = document.createElement('li')
  li.innerText = message.data
  messageList.append(li)
})

// 서버가 오프라인이 되었을 때
socket.addEventListener('close', () => {
  console.log('disconnected from server')
})
//
// setTimeout(() => {
//   socket.send("hello from browser")
// }, 5000)

function makeMessage(type, payload) {
  const msg = { type, payload }
  return JSON.stringify(msg)
}
function handleSubmit(event) {
  event.preventDefault()
  const input = messageForm.querySelector('input');
  // socket.send(input.value)
  socket.send(makeMessage("new_message", input.value));
  input.value = ""
}

messageForm.addEventListener('submit', handleSubmit)

function handleNickSubmit(event) {
  event.preventDefault()
  const input = nickForm.querySelector('input')
  socket.send(makeMessage("nickname", input.value));
  input.value = ""
}

nickForm.addEventListener('submit', handleNickSubmit)
