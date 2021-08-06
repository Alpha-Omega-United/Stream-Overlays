console.log("FIRST LINE")

const AOU_LOGO = "https://github.com/OikoumE/AoU-Community/raw/d67301fa8224ad21a28b8d32c83d85e50bb6ed2c/assets/aou_logo.png",
      AOU_LOGO_SCALE = 0.15;

const START_POS = {x: 1920/2, y: -500},
      END_POS = {x: 1920/2, y:1080/3};

let nameColor,
    fontColor,
    fontStroke,
    fontShadow,
    logoShadow,
    profileShadow,
    delaySo,
    animSpeedSo,
    durationSo,
    includeLogo,
    previewSO,
    previewUser,
    shoutoutString,
    shoutoutCommand,
    shoutoutCommandArray = [];

let SHOUT_OUT_LIST = [],
    SHOUT_OUT_QUEUE = [],
    previewQueue = [],
    MEMBER_LIST = [];

let canvas = document.getElementById("AOU_SO_AREA");
let ctx = canvas.getContext("2d");

// ------------------ EVENTS ------------------ //
window.addEventListener('onWidgetLoad', async function (obj) {
  const fieldData = obj.detail.fieldData;
  fontColor = fieldData.fontColor
  fontStroke = fieldData.fontStroke
  fontShadow = fieldData.fontShadow
  logoShadow = fieldData.logoShadow
  profileShadow = fieldData.profileShadow
  nameColor = fieldData.nameColor
  delaySo = fieldData.delaySo
  durationSo = fieldData.durationSo
  animSpeedSo = fieldData.animSpeedSo
  includeLogo = fieldData.includeLogo
  previewSO = fieldData.previewSO
  previewUser = fieldData.previewUser
  shoutoutCommand = fieldData.shoutoutCommand
  shoutoutString = fieldData.shoutoutString

  shoutoutCommandArray = shoutoutCommand.split(",")
  console.log(shoutoutCommandArray)
  if (previewSO == "true"){
    makeAndAddUserToQueue(previewUser, true)
  } else {
    previewQueue = []
  }
})

window.addEventListener('onEventReceived', function(obj) {
  if (obj.detail.listener === "message") {
    let data = obj.detail.event.data;
    // console.log(data)
    if (data.userId == data.tags['room-id']){
      messageContent = data.text.split(" ")
      command = messageContent.splice(0, 1)
      content = messageContent.join(" ").replace("@", "")
      console.log(command[0])
      console.log(content)

      if (shoutoutCommandArray.includes(command[0]) && shoutoutCommandArray.length > 0){
        console.log("hi");
        makeAndAddUserToQueue(content, false);
      }
    }
    if (SHOUT_OUT_LIST.includes(data.nick) && data.userId != data.tags['room-id']) {
      console.log(data.nick)
      makeAndAddUserToQueue(data.nick, false)
    }
  }
})

function makeAndAddUserToQueue(userName, preview){
  let startPos = JSON.parse(JSON.stringify(START_POS));
  let newUser = new ShoutOutUser(userName, startPos, preview)
  newUser.init().then(() => {
    if (!preview){
      SHOUT_OUT_QUEUE.push(newUser)
      removeUserFromSoList(userName)
    } else {
      previewQueue.push(newUser)
    }
  })
}

// ------------------ DRAWING ------------------ //
async function getAouData(){
  let data_endpoint = "https://raw.githubusercontent.com/OikoumE/AoU-Community/main/bot/data/aou_members.json";
  let result = await fetch(data_endpoint, {
    method: "GET", // or 'PUT'
    headers: { "Content-Type": "text/plain" },
  })
  .then((result) => result.json())
  .then((data) => data);
  return result
}
async function makeSoList() {
  let result = await getAouData()
  for (let [key, value] of Object.entries(result["users"])) {
    SHOUT_OUT_LIST.push(key)
    MEMBER_LIST.push(key)
  }
}

function removeUserFromSoList(user) {
  let index = SHOUT_OUT_LIST.indexOf(user)
  SHOUT_OUT_LIST.splice(index, 1)
  console.log(user + " removed from SO list")
}

// ------------------ CLASS ------------------ //

class ShoutOutUser {
  constructor(name, pos, preview) {
    this.preview = preview
    this.pos = pos
    this.name = name
    this.profilePicSrc
    this.profile_pic
    this.done = false
    this.animInDone = false
    this.animOutDone = false
    this.animWaitDone = false
    this.animInTimer = false
    this.init()
  }

  async init() {
    this.profilePicSrc = await this.getProfilePic(this.name)
    this.profile_pic = makeImg(this.profilePicSrc)

  }
  async getProfilePic(user) {
    let endpoint = `https://decapi.me/twitch/avatar/${user}`
    let result = await fetch(endpoint, {
      method: "GET", // or 'PUT'
      headers: { "Content-Type": "text/plain" },
    })
    .then((response) => response.text())
    .then((data) => data);
    return result
  }
  drawProfilePic (pos) {
    ctx.shadowBlur = 25;
    ctx.shadowColor = profileShadow;
    ctx.drawImage(this.profile_pic, pos.x - this.profile_pic.width/2, pos.y - this.profile_pic.height/2 - 50)
    ctx.shadowBlur = 0;
  }

  drawName(pos){
    ctx.shadowBlur = 25;
    ctx.shadowColor = fontShadow;
    ctx.strokeStyle = fontStroke;
    ctx.font = "bold 60px Courier";
    ctx.fillStyle = fontColor;

    let drawString = shoutoutString
    let drawStringWidth = ctx.measureText(drawString).width;
    ctx.fillText(drawString, pos.x - drawStringWidth / 2, pos.y - 200);
    ctx.strokeText(drawString, pos.x - drawStringWidth / 2, pos.y - 200);
    ctx.font = "bold 80px Courier";
    ctx.fillStyle = nameColor;
    let nameWidth = ctx.measureText(this.name).width;
    ctx.fillText(this.name, pos.x - nameWidth / 2, pos.y + 100);
    ctx.strokeText(this.name, pos.x - nameWidth / 2, pos.y + 100);
    ctx.shadowBlur = 0;

  }
  draw() {
    if (this.pos.y < END_POS.y && !this.animWaitDone) {
      this.animateIn()
    } else {
      this.animInDone = true;
    }
    if (this.animInDone) {
      this.animInTimer = true;
      setTimeout(() => {
        this.animWaitDone = true;
      }, durationSo*1000);
    }
    if (this.animWaitDone) {
      this.animateOut()
    }
    this.drawProfilePic(this.pos)
    this.drawName(this.pos)
    if (includeLogo != "false"){
      drawLogo(this.pos)
    }
  }
  animateIn() {
    this.pos.y += animSpeedSo;
  }
  animateOut() {
    if (this.pos.y > START_POS.y){
      this.pos.y -= animSpeedSo;
    } else {
      this.cleanUp()
    }
  }
  animateWait() {
    console.log("asdas")
  }
  cleanUp() {
    if (!this.hasCleaned) {
      console.log("cleaning up")
      setTimeout(() =>{
        SHOUT_OUT_QUEUE.splice(0, 1)
        if (this.preview){
          previewQueue = []
          console.log("making new preview user")
          makeAndAddUserToQueue("itsoik", true)
        }
      }, delaySo*1000)
      this.hasCleaned = true
    }
  }
}

let logo = makeImg(AOU_LOGO)
function drawLogo (pos) {
  ctx.shadowBlur = 25;
  ctx.shadowColor = logoShadow;
  ctx.drawImage(logo, pos.x - ((logo.width* AOU_LOGO_SCALE)  / 2 ), pos.y - ((logo.height * AOU_LOGO_SCALE)  / 2 ) + 250, logo.width * AOU_LOGO_SCALE, logo.height * AOU_LOGO_SCALE)
  ctx.font = "bold 40px Courier";
  ctx.shadowColor = fontShadow;
  ctx.fillStyle = fontColor;
  let drawString2,
      name;
  if (SHOUT_OUT_QUEUE.length > 0){
    name = SHOUT_OUT_QUEUE[0].name
  } else if (previewQueue.length > 0){
    name = previewQueue[0].name
  }
  if (MEMBER_LIST.includes(name)) {
    drawString2 = `They are a member of !AoU`
  } else {
    drawString2 = `Do !AoU to get more info on the community`
  }
  let drawStringWidth2 = ctx.measureText(drawString2).width;
  ctx.fillText(drawString2, pos.x - drawStringWidth2 / 2, pos.y + 150);
  ctx.strokeText(drawString2, pos.x - drawStringWidth2 / 2, pos.y + 150);
  ctx.shadowBlur = 0;
}

function makeImg(src) {
  let image  = new Image();
  image.src = src
  return image
}
// ------------------ MAIN ------------------ //
function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (previewQueue.length > 0){
    previewQueue[0].draw()
  }
  if (SHOUT_OUT_QUEUE.length > 0){
    SHOUT_OUT_QUEUE[0].draw()
  }
  window.requestAnimationFrame(draw)
}
makeSoList()

window.requestAnimationFrame(draw)