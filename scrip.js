let voltaje = 0;
let corriente = 0;
let temperatura = 0;
let nivelAudio = 0;

let tiempoGrafica = 0;

let conectado = false;



const TIEMPO_LIMITE_DESCONEXION = 10000;

const INTERVALO_CONECTADO = 1000;

const INTERVALO_DESCONECTADO = 3000;


let intervaloConsulta = null;



let ultimoTiempoRespuesta = 0;



const voltajeHTML =
    document.getElementById("voltaje");

const corrienteHTML =
    document.getElementById("corriente");

const potenciaHTML =
    document.getElementById("potencia");

const temperaturaHTML =
    document.getElementById("temperatura");

const nivelAudioHTML =
    document.getElementById("nivelAudio");

const porcentajeAudioHTML =
    document.getElementById("porcentajeAudio");

const estadoHTML =
    document.getElementById("estado");

const alertasHTML =
    document.getElementById("alertas");

const ventiladorHTML =
    document.getElementById("ventilador");


const btnVentiladorOn =
    document.getElementById("btnVentiladorOn");

const btnVentiladorOff =
    document.getElementById("btnVentiladorOff");

const btnPrueba =
    document.getElementById("btnPrueba");




function cambiarTemaConectado() {


    document.body.classList.remove(
        "desconectado-global"
    );


    document.body.classList.add(
        "conectado-global"
    );

}



function cambiarTemaDesconectado() {


    document.body.classList.remove(
        "conectado-global"
    );


    document.body.classList.add(
        "desconectado-global"
    );

}



function cambiarIntervalo(tiempo) {

    if (intervaloConsulta !== null) {

        clearInterval(intervaloConsulta);

    }


    intervaloConsulta =
        setInterval(
            consultarSenal,
            tiempo
        );

}


async function consultarSenal() {

    try {

        const respuesta =
            await fetch(
                "/datos",
                {
                    cache: "no-store",

                    signal:
                        AbortSignal.timeout(2500)
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "ESP32 no respondió correctamente"
            );

        }

        const datos =
            await respuesta.json();


        voltaje =
            Number(datos.voltaje) || 0;

        corriente =
            Number(datos.corriente) || 0;

        temperatura =
            Number(datos.temperatura) || 0;

        nivelAudio =
            Number(datos.nivelAudio) || 0;


        ultimoTiempoRespuesta =
            Date.now();

        if (!conectado) {

            conectado = true;



            cambiarTemaConectado();


            cambiarIntervalo(
                INTERVALO_CONECTADO
            );

        }

    }

    catch (error) {


        verificarTiempoLimite();

    }


  

    actualizarInterfaz();

    actualizarGrafica();

}



function verificarTiempoLimite() {

  

    if (ultimoTiempoRespuesta === 0) {

        ultimoTiempoRespuesta =
            Date.now();

    }


    const tiempoSinRespuesta =
        Date.now() -
        ultimoTiempoRespuesta;


    
    if (
        tiempoSinRespuesta >=
        TIEMPO_LIMITE_DESCONEXION
    ) {

        if (conectado) {

            conectado = false;


         
            voltaje = 0;

            corriente = 0;

            temperatura = 0;

            nivelAudio = 0;



            cambiarTemaDesconectado();


            

            cambiarIntervalo(
                INTERVALO_DESCONECTADO
            );

        }

    }

}


function actualizarInterfaz() {

    verificarTiempoLimite();


    if (!conectado) {

      

        cambiarTemaDesconectado();


        estadoHTML.className =
            "estado desconectado";

        estadoHTML.innerHTML =
            "🩷 ESP32 DESCONECTADO";


        voltajeHTML.innerHTML =
            "0 V";

        corrienteHTML.innerHTML =
            "0 A";

        potenciaHTML.innerHTML =
            "0 W";

        temperaturaHTML.innerHTML =
            "0 °C";


        nivelAudioHTML.style.width =
            "0%";

        porcentajeAudioHTML.innerHTML =
            "0 %";



        ventiladorHTML.innerHTML =
            "💨 Ventilador: DESCONECTADO";


    

        btnVentiladorOn.disabled = true;

        btnVentiladorOff.disabled = true;

        btnPrueba.disabled = true;



        alertasHTML.innerHTML =
            '<div class="alerta">' +
            '⚠️ ESP32 desconectado.' +
            '<br>' +
            '🔄 Intentando reconectar...' +
            '</div>';


        return;

    }

    cambiarTemaConectado();


    btnVentiladorOn.disabled = false;

    btnVentiladorOff.disabled = false;

    btnPrueba.disabled = false;


    voltajeHTML.innerHTML =
        voltaje.toFixed(2) + " V";

    corrienteHTML.innerHTML =
        corriente.toFixed(2) + " A";


    const potencia =
        voltaje * corriente;


    potenciaHTML.innerHTML =
        potencia.toFixed(2) + " W";



    temperaturaHTML.innerHTML =
        temperatura.toFixed(1) + " °C";



    let audio =
        Math.max(
            0,
            Math.min(
                100,
                nivelAudio
            )
        );


    nivelAudioHTML.style.width =
        audio + "%";


    porcentajeAudioHTML.innerHTML =
        audio + " %";


    ventiladorHTML.innerHTML =
        "💨 Ventilador: AUTOMÁTICO";



    revisarLecturasSistema();

}


function revisarLecturasSistema() {

    let estadoTexto =
        "🟢 SISTEMA NORMAL";


    estadoHTML.className =
        "estado normal";


    alertasHTML.innerHTML =
        '<p class="sin-alertas">' +
        '🟢 No hay alertas' +
        '</p>';



    if (
        voltaje < 11 &&
        voltaje > 0
    ) {

        estadoTexto =
            "🟡 VOLTAJE BAJO";

        estadoHTML.className =
            "estado advertencia";

        mostrarAlerta(
            "⚠️ Voltaje bajo: " +
            voltaje.toFixed(2) +
            " V"
        );

    }



    if (voltaje > 15) {

        estadoTexto =
            "🔴 VOLTAJE ALTO";

        estadoHTML.className =
            "estado peligro";

        mostrarAlerta(
            "🚨 Voltaje excesivo: " +
            voltaje.toFixed(2) +
            " V"
        );

    }



    if (
        temperatura > 60 &&
        temperatura <= 70
    ) {

        estadoTexto =
            "🟡 TEMPERATURA ELEVADA";

        estadoHTML.className =
            "estado advertencia";

        mostrarAlerta(
            "⚠️ Temperatura elevada: " +
            temperatura.toFixed(1) +
            " °C"
        );

    }


    if (temperatura > 70) {

        estadoTexto =
            "🔴 SOBRECALENTAMIENTO";

        estadoHTML.className =
            "estado peligro";

        mostrarAlerta(
            "🚨 Temperatura crítica: " +
            temperatura.toFixed(1) +
            " °C"
        );

    }



    if (corriente > 15) {

        estadoTexto =
            "🔴 SOBRECORRIENTE";

        estadoHTML.className =
            "estado peligro";

        mostrarAlerta(
            "🚨 Corriente excesiva: " +
            corriente.toFixed(2) +
            " A"
        );

    }


    estadoHTML.innerHTML =
        estadoTexto;

}


function mostrarAlerta(mensaje) {

    alertasHTML.innerHTML =
        '<div class="alerta">' +
        mensaje +
        '</div>';

}



function activarVentilador() {

    if (!conectado) {

        return;

    }


    ventiladorHTML.innerHTML =
        "💨 Ventilador: ENCENDIDO";


    fetch("/ventilador/on")
        .catch(() => {

            console.log(
                "Error enviando comando"
            );

        });

}


function desactivarVentilador() {

    if (!conectado) {

        return;

    }


    ventiladorHTML.innerHTML =
        "🛑 Ventilador: APAGADO";


    fetch("/ventilador/off")
        .catch(() => {

            console.log(
                "Error enviando comando"
            );

        });

}

function iniciarPrueba() {

    if (!conectado) {

        return;

    }


    fetch("/prueba")
        .catch(() => {

            console.log(
                "Error iniciando prueba"
            );

        });

}



const ctx =
    document.getElementById("grafica");


const grafica =
    new Chart(
        ctx,
        {

            type: "line",

            data: {

                labels: [],

                datasets: [

                    {

                        label:
                            "Voltaje (V)",

                        data: [],

                        tension: 0.2,

                        borderColor:
                            "#3498db",

                        backgroundColor:
                            "rgba(52,152,219,0.15)",

                        fill: true

                    },


                    {

                        label:
                            "Temperatura (°C)",

                        data: [],

                        tension: 0.2,

                        borderColor:
                            "#e74c3c",

                        backgroundColor:
                            "rgba(231,76,60,0.15)",

                        fill: true

                    }

                ]

            },


            options: {

                responsive: true,

                animation: false,

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        }

    );


function actualizarGrafica() {

    tiempoGrafica++;


    grafica.data.labels.push(
        tiempoGrafica + " s"
    );


    grafica.data.datasets[0]
        .data
        .push(voltaje);


    grafica.data.datasets[1]
        .data
        .push(temperatura);


    /*
       Máximo 20 puntos.
    */

    if (
        grafica.data.labels.length > 20
    ) {

        grafica.data.labels.shift();


        grafica.data.datasets
            .forEach(
                dataset => {

                    dataset.data.shift();

                }
            );

    }


    grafica.update();

}



cambiarIntervalo(
    INTERVALO_CONECTADO
);


setInterval(
    verificarTiempoLimite,
    1000
);




consultarSenal();

