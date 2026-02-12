const spank = new Audio("thespank.m4a")

const image = document.getElementById("froggy");
const counter = document.getElementById("counter");
const button = document.getElementById("startButton");
let timer = document.getElementById("timer");
let count = 0;
let seconds = 0;


const box = document.getElementById("box");
 

 


function changeLocation(){
  
 setTimeout(() => {})
 let x = Math.floor(Math.random()*(70-10)+10);
  x = x.toString();
  x = x + "%"
  let y = Math.floor(Math.random()*(70-10)+10);
  y = y.toString()
  y = y + "%"
image.style.top= x ;
image.style.left= y;
console.log(x,y)


}

function catchFrog() {
setTimeout(() => {
image.style.opacity = "0";}, 1000)

setTimeout(() => {
image.style.opacity = "1";
  }, 1000);
}

function changeCount(){
count++ ;
console.log(count)

counter.textContent=count

}

function tick() {
         
      timer.textContent=(`Time left: ${seconds} second(s)`);

        seconds--;
 if(seconds==0){
    button.style.display="flex"
  }
        if (seconds >= 0) {
           
            setTimeout(tick, 1000);
        } else {
            console.log("⏰ Time's up!");
        }
    }

function startTimer() {
    seconds =10;
    tick();
}

function removeButton(){
  
  button.style.display="none"
}

function resetCount(){
  count=0
}
function removeFrog(){

  if(seconds==0 || seconds<0){
  image.style.display= "none"
 box.style.visibility="hidden"}

  }

function addFrog(){
image.style.display= "flex"

}
function addPan(){
  box.style.visibility="visible"
}

function addSpank(){

spank.play()

}


counter.textContent=count
button.addEventListener("click",startTimer)
button.addEventListener("click",removeButton)
button.addEventListener("click",resetCount)
button.addEventListener("click",addFrog)
button.addEventListener("click",addPan)
image.addEventListener("click",removeFrog)
image.addEventListener("click",addSpank)
image.addEventListener("click",changeCount)
image.addEventListener("click", changeLocation)
image.addEventListener("click", catchFrog)
document.addEventListener("mousemove", (e) => { 
  box.style.left = e.clientX + "px"; box.style.top = e.clientY + "px"; });

