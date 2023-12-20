import './style.css'
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, getDocs, onSnapshot, doc, query} from "firebase/firestore";






const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const gridCtx= canvas.getContext("2d");
const curseur = document.getElementById("curseur");
const divTemps= document.getElementById("temps");
const taillePixel = 10;
const couleurs = [
    [120,28,129], //violet
    [64,67,153], //indigo
    [72,139,194], //blue
    [107,178,140], //green
    [159,190,87], //olive
    [210,179,63], //yellow
    [231,126,49], //orange
    [217,33,32] //red
]
const reglageTemps= 10;

let login="";
let timeur=0;
let timestamp;
let timeout;
let verrou= false;
let thread = true;

const firebaseConfig = {
    apiKey: "AIzaSyCQMj7K-QffvYA7kJSEYfJfL0lLqRaRRtw",
    authDomain: "pixelwar-a73b2.firebaseapp.com",
    projectId: "pixelwar-a73b2",
    storageBucket: "pixelwar-a73b2.appspot.com",
    messagingSenderId: "601587079264",
    appId: "1:601587079264:web:5ce379926c667105294b05"
};

const fb = initializeApp(firebaseConfig);
const db= getFirestore(fb);



let couleurSelR = couleurs[0][0];
let couleurSelG = couleurs[0][1];
let couleurSelB = couleurs[0][2];
let couleurSelectionnee = "rgb("+couleurSelR+","+couleurSelG+","+couleurSelB+")";

validationPseudo()

const assembleCouleur = () => {

    drawGrids(gridCtx, canvas.width, canvas.height,taillePixel,taillePixel);
    //afficheTousPixels();
    getSnapShot();

    canvas.addEventListener("mousemove", function (e){
        const curseurLeft = e.clientX -( curseur.offsetWidth / 2);
        const curseurTop = e.clientY - (curseur.offsetHeight / 2);
        const calculMoyenLeft= Math.floor(curseurLeft / taillePixel) * taillePixel - taillePixel/2;
        const calculMoyenTop = Math.floor(curseurTop / taillePixel) * taillePixel;
        curseur.style.left = calculMoyenLeft+"px";
        curseur.style.top = calculMoyenTop+"px";

        canvas.addEventListener("click", function(event) {
            const mouseX = curseur.offsetLeft - canvas.getBoundingClientRect().left + (taillePixel/2);
            const mouseY = curseur.offsetTop - canvas.getBoundingClientRect().top+ (taillePixel/2);
            ctx.fillStyle=couleurSelectionnee;
            if(timeur<1){
                if(thread){
                    thread=false;
                    ctx.fillRect(mouseX - taillePixel / 2, mouseY - taillePixel / 2, taillePixel, taillePixel);
                    sendPixelToBDD(curseur.offsetLeft, curseur.offsetTop);
                    calculTemps();
                }
            }
        });

    });

    document.getElementById("titre").innerHTML= "Bienvenue "+login;
    divTemps.innerHTML= "Vous pouvez jouer";


    couleurs.forEach(couleur =>{
        const divConteneurCouleur = document.getElementById("couleurs");
        const divCouleur= document.createElement("div");
        let couleurEnCoursR = couleur[0];
        let couleurEnCoursG = couleur[1];
        let couleurEnCoursB = couleur[2];
        divCouleur.style.backgroundColor = "rgb("+couleurEnCoursR+","+couleurEnCoursG+","+couleurEnCoursB+")";
        divCouleur.setAttribute('class', 'nonModifie')
        divConteneurCouleur.appendChild(divCouleur);
        divCouleur.addEventListener("mouseenter",(e)=>{
            e.target.style.borderColor="black"
            e.target.style.borderStyle="solid"
        });
        divCouleur.addEventListener("mouseleave",(e)=>{
            if(e.target.getAttribute("class")==="nonModifie"){
                e.target.style.borderColor="none"
                e.target.style.borderStyle="none"
            }
        });
        divCouleur.addEventListener("click",(e)=>{
            const toutesDivModifiees=document.getElementsByClassName("modification");
            for(let i=0; i<toutesDivModifiees.length;i++){
                toutesDivModifiees[i].style.borderColor="none"
                toutesDivModifiees[i].style.borderStyle="none"
                toutesDivModifiees[i].setAttribute('class', 'nonModifie');
            }
            e.target.setAttribute('class', 'modification');
            e.target.style.borderColor="black";
            e.target.style.borderStyle="solid";
            couleurSelectionnee=  e.target.style.backgroundColor;
        });
    });
}

function validationPseudo(){
    document.getElementById("surface").style.opacity = "0.3";
    const pseudo= document.getElementById("saisie");
    const bouton = document.getElementById("boutonValide")
    const messageErreur=document.getElementById("validation");
    bouton.addEventListener("click",()=>{
        if(pseudo.value !==""){
            messageErreur.innerHTML=""
            document.getElementById("surface").style.opacity = "1";
            document.getElementById("login").style.visibility="hidden";
            login=pseudo.value;
            assembleCouleur();
        }else{
            messageErreur.innerHTML="Merci de saisir un login"
        }
    });
}

const drawGrids= (cxt, width, height, cellWidth, cellHeight) => {
    cxt.beginPath()
    cxt.strokeStyle= "#ccc"

    for(let i=0; i<width;i++){
        cxt.moveTo(i * cellWidth, 0);
        cxt.lineTo(i * cellWidth, height);
    }

    for(let i=0; i<height;i++){
        cxt.moveTo(0, i * cellHeight );
        cxt.lineTo( width, i * cellHeight);
    }
    cxt.stroke();
}

const calculTemps= () => {
    if(!verrou){
        timeout = new Date().getTime()+(reglageTemps*1000);
    }
    verrou=true;


    let temps = setInterval(function(){
        timestamp = new Date().getTime();
        var t = timeout - timestamp;
        timeur = Math.floor((t % (1000 * 60)) / 1000);
        if(t<1){
            verrou=false;
            thread=true;
            divTemps.innerHTML= "Vous pouvez jouer";
            clearInterval(temps);
        }else{
            divTemps.innerHTML= "Attendez : "+timeur;
        }
    });
}

const sendPixelToBDD= async (x, y) => {
    const pixel = {
        x,
        y,
        color: couleurSelectionnee,
        user: login
    }
    try {
        const docRef = await addDoc(collection(db, "pixels"), pixel)
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

const getPixelFromBDD= async () => {
    try{
        return await getDocs(collection(db, "pixels"));
    } catch (e){
        console.error("Error connexion: ", e);
    }
}

//    const unsub = onSnapshot(doc(db, "pixels"), (doc) => {

const getSnapShot = async () => {
    const queryBDD= query(collection(db, "pixels"));
    const unsubscribe = onSnapshot(queryBDD, (querySnapshot) => {
        querySnapshot.forEach((dc) => {
            const pixelEnLecture = {
                x: dc.data().x,
                y: dc.data().y,
                color: dc.data().color,
                user: dc.data().user
            }
            const recuperationX = pixelEnLecture.x - canvas.getBoundingClientRect().left + (taillePixel / 2);
            const recuperationY = pixelEnLecture.y - canvas.getBoundingClientRect().top + (taillePixel / 2);
            ctx.fillStyle = pixelEnLecture.color;
            ctx.fillRect(recuperationX - taillePixel / 2, recuperationY - taillePixel / 2, taillePixel, taillePixel);
        });
    });
}