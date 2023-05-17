import { Configuration, OpenAIApi } from 'openai'
import 'bootstrap'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import TravelAgent from './assets/travelGuy.png'
import TravelBG from './assets/travel-bg.jpg'
import LoadingImg from './assets/loading.svg'
import './style.css'

const secretKey = process.env.OPENAI_API_KEY
const configuration = new Configuration({
  apiKey: secretKey
})

const openai = new OpenAIApi(configuration)

const AIPromptEl = document.querySelector<HTMLElement>('#app-ai-prompt-inner');
  if(!AIPromptEl)throw new ReferenceError(`Ai Prompt container doesn't exist`)
const userInputEl = document.querySelector<HTMLElement>('#user-prompt-container');
  if(!userInputEl)throw new ReferenceError(`Ai Prompt container doesn't exist`)

async function callForCompletion(textPrompt:string, tokens:number, temp:number|null ){
  return await openai.createCompletion({
    model:'text-davinci-003',
    prompt: textPrompt,
    temperature: temp != null? temp : 1,
    max_tokens: tokens != null? tokens : 16,
  })
}

function renderWithResponse(element:string, data:string){
  const funcEl = document.querySelector<HTMLElement>(element)
  if(!funcEl)throw new ReferenceError(`${element} doesn't exist`)
  funcEl.innerText = data
}

async function generateImage(prompt:string) {
  const response = await openai.createImage({
    prompt: `${prompt}. There should be no text in this image.`,
    n: 1,
    size: '512x512',
    response_format: 'b64_json'
  })

  const vacationImgEl = document.querySelector<HTMLElement>('#vacation-img-container');
  if(!vacationImgEl)throw new ReferenceError(`vacation-image-container doesn't exist`)
  vacationImgEl.innerHTML = `<img src="data:image/png;base64,${response.data.data[0].b64_json}">`
  if(!userInputEl)throw new ReferenceError(`Ai Prompt container doesn't exist`)
  userInputEl.innerHTML = `<button id="view-pitch-btn" class="view-pitch-btn">View Pitch</button>`
  const pitchBtnEl = document.querySelector<HTMLElement>('#view-pitch-btn');
  if(!pitchBtnEl)throw new ReferenceError(`pitch button doesn't exist`)
  pitchBtnEl.addEventListener('click', ()=>{
    userInputEl.style.display = 'none'
    const responseEl = document.querySelector<HTMLElement>('#app-ai-response')
    if(!responseEl)throw new ReferenceError(`pitch button doesn't exist`)
    responseEl.style.display = 'flex'
    renderWithResponse('#travel-agent-text', `This idea is so good I'm jealous! Any chance you might take me with you 🛫`)
  })
}

function createBackground():void{ 
  document.body.style.backgroundImage = `url(${TravelBG})`
  document.body.style.backgroundSize = `cover`
  document.body.style.backgroundRepeat = `repeat` 
}

function addTravelGuy():void{
  let img = new Image()
  img.src = TravelAgent
  img.classList.add('--travel-guy')
  AIPromptEl?.prepend(img)
}

document.getElementById('btn-send-prompt')?.addEventListener('click', async ()=>{
  const textInput= document.querySelector<HTMLInputElement>('#user-prompt-input');
  if(!textInput)throw new ReferenceError(`user-prompt-input doesn't exist`)
  if(textInput.value){
    const userInput:string = textInput.value;
    userInputEl.innerHTML = `<img src=${LoadingImg} class="loading" id="loading">`
    renderWithResponse('#travel-agent-text', `Ok, just wait a second while my digital brain digests that...`)
  
    const qPrompt:string = `Generate a short message to enthusiastically say the experience sounds interesting and that you need some minutes to think about it.
    ###
    experience: A sandy beach filled with young people to mingle with.
    message: I'll need to think about that. But this experience sounds amazing! I love feeling the sand in my toes!
    ###
    experience:${userInput}
    message:
    `
    const qResponse = await callForCompletion(qPrompt, 40, null)
    console.log(qResponse)
    if(!qResponse.data.choices[0].text)throw new ReferenceError(`qResponse doesn't exist`)
    renderWithResponse('#travel-agent-text', qResponse.data.choices[0].text.trim())

    const sPrompt:string = `Generate an engaging, wonderous and marketable trip synopsis based on the experience. Think about what activities they could do in the experience you provide. Write any specific locations in brackets. 
    ###
    experience: Somewhere in the world where cuisine is considered to be top notch.
    synopsis: If it is fine dining you want then Pisa, Italy is the place to go. Every cafe and restaurant on the corner will have you feeling like you are on a movie set.
    You absolutely must dine at [V Beny] or [I Lumi Di San Rossore] where the seafood is to die for.
    ###
    experience: ${userInput}
    synopsis: 
    `
    const sResponse = await callForCompletion(sPrompt, 200, null)
    console.log(sResponse)
    if(!sResponse.data.choices[0].text)throw new ReferenceError(`sResponse doesn't exist`)
    const synopsis:string = sResponse.data.choices[0].text.trim()
    renderWithResponse('#vacation-text', synopsis)

    const tPrompt:string = `Write an intriguing title based on the synopsis
    ###
    synopsis:Get ready to party and experience the unbelievable nightlife of Barcelona, Spain! Start your night off with a drink at the infamous [Razzmatazz], 
    sip some beer under the stars at [Sutton] and move to the groovy beats at [Opium]. This is the ultimate escape for anyone ready to keep the party alive!
    title: Burning the Midnight Oil in Barcelona!
    ###
    synopsis:${synopsis}
    title:
    `
    const tResponse = await callForCompletion(tPrompt, 30, .9)
    console.log(tResponse)
    if(!tResponse.data.choices[0].text)throw new ReferenceError(`tResponse doesn't exist`)
    const title = tResponse.data.choices[0].text.trim()
    renderWithResponse('#vacation-title', title)

    const lPrompt:string = `Generate a response of all the locations listed in brackets
    ###
    synopsis:Visit the stunning [Lagoa das Sete Cidades] for some of the most breath-taking scenery. 
    Go up to the cottage town of [Furnas] for some of the best hiking 
    trails. Enjoy some delicious local gastronomy in the [S.Cristovão] beach.
    stars: Lagoa das Sete Cidades, Furnas, S.Cristovão
    ###
    synopsis:${synopsis}
    stars:
    `
    const lResponse = await callForCompletion(lPrompt, 25, null)
    console.log(lResponse)
    if(!lResponse.data.choices[0].text)throw new ReferenceError(`lResponse doesn't exist`)
    renderWithResponse('#vacation-activities', lResponse.data.choices[0].text.trim())

    const iPrompt = `Give a short description of an image which could be used to advertise the experience based on the title and synopsis. The description should be rich in visual detail but contain no names.
    ###
    title: Romancing in Bali - An Unforgettable Holiday Awaits!
    synopsis: For a romantic escapade, look no further than beautiful Bali. Relax and unwind on River Rafting Tours in the Ayung River or explore Balinese culture with a 
    visit to a local community temple. Sample traditional Balinese cuisine in a peaceful setting at [La Summer Gallery] or take a romantic walk along the 
    shore of [Nusa Dua Beach]. Make your romantic stay in Bali unique with a sunrise hot-air balloon ride over the horizon, and indulge in tranquil spa treatments 
    available in some of the finest hotels and resorts.
    image description: A collage of hot-air balloon at sunrise, beautiful temples, and breathtaking rivers in Bali.
    ###
    title: ${title}
    synopsis: ${synopsis}
    image description: 
    `
    const iResponse = await callForCompletion(iPrompt, 80, .8)
    console.log(iResponse)
    if(!iResponse.data.choices[0].text)throw new ReferenceError(`iResponse doesn't exist`)
    const imagePromt = iResponse.data.choices[0].text.trim()
    console.log(imagePromt)

    generateImage(imagePromt)
  } 
})

createBackground()
addTravelGuy()