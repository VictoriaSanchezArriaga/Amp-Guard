
/* =====================================
   VARIABLES
   ===================================== */

let voltaje = 0;
let corriente = 0;
let temperatura = 0;
let nivelAudio = 0;

let tiempoGrafica = 0;

let conectado = false;


/* =====================================
   CONFIGURACIÓN DE CONEXIÓN
   ===================================== */

/*
   Tiempo máximo sin recibir datos
   antes de considerar desconectado.
*/
const TIEMPO_LIMITE_DESCONEXION = 10000;


/*
   Cuando está conectado:
   consultar cada 1 segundo.
*/
const INTERVALO_CONECTADO = 1000;


/*
   Cuando está desconectado:
   intentar nuevamente cada 3 segundos.
*/
const INTERVALO_DESCONECTADO = 3000;


/* =====================================
   CONTROL DE INTERVALO
   ===================================== */

let intervaloConsulta = null;


/*
   Última vez que recibimos
   correctamente información.
*/
let ultimoTiempoRespuesta = Date.now();


/* =====================================
   ELEMENTOS HTML
   ===================================== */

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


/* BOTONES */

const btnVentiladorOn =
    document.getElementById("btnVentiladorOn");

const btnVentiladorOff =
    document.getElementById("btnVentiladorOff");

const btnPrueba =
    document.getElementById("btnPrueba");


/* =====================================
   FUNCIÓN PARA CAMBIAR INTERVALO
   ===================================== */

function cambiarIntervalo(nuevoTiempoMs) {

    if (intervaloConsulta !== null) {

        clearInterval(intervaloConsulta);

    }


    intervaloConsulta =
        setInterval(
            consultarSenal,
            nuevoTiempoMs
        );
}


/* =====================================
   CONSULTAR ESP32
   ===================================== */

async function consultarSenal() {

    try {

        /*
           Realizamos petición al ESP32.

           /datos debe existir en el código
           del servidor ESP32.
        */

        const respuesta = await fetch(
            "/datos",
            {
                cache: "no-store",
                signal: AbortSignal.timeout(2500)
            }
        );


        /*
           Si el servidor responde con error,
           consideramos que falló la comunicación.
        */

        if (!respuesta.ok) {

            throw new Error(
                "El ESP32 respondió con error"
            );

        }


        /*
           Convertimos la respuesta a JSON.
        */

        const datos =
            await respuesta.json();


        /* =================================
           RECIBIMOS DATOS CORRECTAMENTE
           ================================= */

        voltaje =
            Number(datos.voltaje) || 0;

        corriente =
            Number(datos.corriente) || 0;

        temperatura =
            Number(datos.temperatura) || 0;

        nivelAudio =
            Number(datos.nivelAudio) || 0;


        /*
           Guardamos el momento de la última
           respuesta correcta.
        */

        ultimoTiempoRespuesta =
            Date.now();


        /*
           Si estaba desconectado y ahora
           respondió el ESP32:
           lo marcamos como conectado.
        */

        if (!conectado) {

            conectado = true;

            /*
               Volvemos a consultar cada segundo.
            */

            cambiarIntervalo(
                INTERVALO_CONECTADO
            );

        }

    }

    catch (error) {

        /*
           No cambiamos inmediatamente
           a desconectado.

           Primero esperamos los 10 segundos.
        */

        verificarTiempoLimite();

    }


    /*
       Actualizamos la pantalla.
    */

    actualizarInterfaz();


    /*
       Actualizamos gráfica.
    */

    actualizarGrafica();

}


/* =====================================
   VERIFICAR DESCONEXIÓN
   ===================================== */

function verificarTiempoLimite() {

    const tiempoTranscurrido =
        Date.now() - ultimoTiempoRespuesta;


    /*
       Si llevamos más de 10 segundos
       sin respuesta...
    */

    if (
        tiempoTranscurrido >=
        TIEMPO_LIMITE_DESCONEXION
    ) {

        /*
           Si todavía aparecía como conectado,
           cambiamos a desconectado.
        */

        if (conectado) {

            conectado = false;


            /*
               Ponemos las mediciones en cero.
            */

            voltaje = 0;

            corriente = 0;

            temperatura = 0;

            nivelAudio = 0;


            /*
               Intentar conexión cada 3 segundos.
            */

            cambiarIntervalo(
                INTERVALO_DESCONECTADO
            );

        }

    }

}


/* =====================================
   ACTUALIZAR INTERFAZ
   ===================================== */

function actualizarInterfaz() {

    /*
       Comprobar primero si se perdió
       la conexión.
    */

    verificarTiempoLimite();


    /* =================================
       ESP32 DESCONECTADO
       ================================= */

    if (!conectado) {

        /*
           🩷 ACTIVAR TEMA ROSA
        */

        document.body.classList.add(
            "desconectado-global"
        );


        /*
           Estado
        */

        estadoHTML.className =
            "estado desconectado";

        estadoHTML.innerHTML =
            "🩷 ESP32 DESCONECTADO";


        /*
           Mediciones
        */

        voltajeHTML.innerHTML =
            "0 V";

        corrienteHTML.innerHTML =
            "0 A";

        potenciaHTML.innerHTML =
            "0 W";

        temperaturaHTML.innerHTML =
            "0 °C";


        /*
           Audio
        */

        nivelAudioHTML.style.width =
            "0%";

        porcentajeAudioHTML.innerHTML =
            "0 %";


        /*
           Ventilador
        */

        ventiladorHTML.innerHTML =
            "💨 Ventilador: DESCONECTADO";


        /*
           Desactivar botones
        */

        btnVentiladorOn.disabled = true;

        btnVentiladorOff.disabled = true;

        btnPrueba.disabled = true;


        /*
           Alerta
        */

        alertasHTML.innerHTML =
            '<div class="alerta">' +
            '⚠️ Sin señal del ESP32 por más de 10 segundos.' +
            '<br>' +
            '🔄 Intentando reconectar...' +
            '</div>';


        return;

    }


    /* =================================
       ESP32 CONECTADO
       ================================= */

    /*
       🟢 QUITAR TEMA ROSA
    */

    document.body.classList.remove(
        "desconectado-global"
    );


    /*
       Activar botones
    */

    btnVentiladorOn.disabled = false;

    btnVentiladorOff.disabled = false;

    btnPrueba.disabled = false;


    /*
       Mostrar mediciones
    */

    voltajeHTML.innerHTML =
        voltaje.toFixed(2) + " V";

    corrienteHTML.innerHTML =
        corriente.toFixed(2) + " A";


    /*
       Calcular potencia
    */

    let potencia =
        voltaje * corriente;


    potenciaHTML.innerHTML =
        potencia.toFixed(2) + " W";


    /*
       Temperatura
    */

    temperaturaHTML.innerHTML =
        temperatura.toFixed(1) + " °C";


    /*
       Audio
    */

    /*
       Evitamos valores superiores
       al 100%.
    */

    let audioSeguro =
        Math.max(
            0,
            Math.min(100, nivelAudio)
        );


    nivelAudioHTML.style.width =
        audioSeguro + "%";


    porcentajeAudioHTML.innerHTML =
        audioSeguro + " %";


    /*
       Ventilador
    */

    ventiladorHTML.innerHTML =
        "💨 Ventilador: AUTOMÁTICO";


    /*
       Revisar mediciones.
    */

    revisarLecturasSistema();

}


/* =====================================
   REVISAR LECTURAS
   ===================================== */

function revisarLecturasSistema() {

    /*
       Estado inicial
    */

    let estadoTexto =
        "🟢 SISTEMA NORMAL";


    estadoHTML.className =
        "estado normal";


    alertasHTML.innerHTML =
        '<p class="sin-alertas">' +
        '🟢 No hay alertas' +
        '</p>';


    /* =================================
       VOLTAJE BAJO
       ================================= */

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


    /* =================================
       VOLTAJE ALTO
       ================================= */

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


    /* =================================
       TEMPERATURA ELEVADA
       ================================= */

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


    /* =================================
       SOBRECALENTAMIENTO
       ================================= */

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


    /* =================================
       SOBRECORRIENTE
       ================================= */

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


    /*
       Mostrar estado.
    */

    estadoHTML.innerHTML =
        estadoTexto;

}


/* =====================================
   MOSTRAR ALERTA
   ===================================== */

function mostrarAlerta(mensaje) {

    alertasHTML.innerHTML =
        '<div class="alerta">' +
        mensaje +
        '</div>';

}


/* =====================================
   VENTILADOR ENCENDIDO
   ===================================== */

function activarVentilador() {

    /*
       No hacer nada si está desconectado.
    */

    if (!conectado) {

        return;

    }


    ventiladorHTML.innerHTML =
        "💨 Ventilador: ENCENDIDO";


    fetch("/ventilador/on")
        .catch(() => {

            console.log(
                "No se pudo enviar comando"
            );

        });

}


/* =====================================
   VENTILADOR APAGADO
   ===================================== */

function desactivarVentilador() {

    if (!conectado) {

        return;

    }


    ventiladorHTML.innerHTML =
        "🛑 Ventilador: APAGADO";


    fetch("/ventilador/off")
        .catch(() => {

            console.log(
                "No se pudo enviar comando"
            );

        });

}


/* =====================================
   INICIAR PRUEBA
   ===================================== */

function iniciarPrueba() {

    if (!conectado) {

        return;

    }


    fetch("/prueba")
        .catch(() => {

            console.log(
                "No se pudo iniciar la prueba"
            );

        });

}


/* =====================================
   GRÁFICA
   ===================================== */

const ctx =
    document.getElementById("grafica");


const grafica =
    new Chart(ctx, {

        type: "line",

        data: {

            labels: [],

            datasets: [

                {

                    label: "Voltaje (V)",

                    data: [],

                    tension: 0.2,

                    borderColor: "#3498db",

                    backgroundColor:
                        "rgba(52,152,219,0.15)",

                    fill: true

                },


                {

                    label: "Temperatura (°C)",

                    data: [],

                    tension: 0.2,

                    borderColor: "#e74c3c",

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

    });


/* =====================================
   ACTUALIZAR GRÁFICA
   ===================================== */

function actualizarGrafica() {

    tiempoGrafica++;


    /*
       Agregar tiempo.
    */

    grafica.data.labels.push(
        tiempoGrafica + " s"
    );


    /*
       Agregar voltaje.
    */

    grafica.data.datasets[0].data.push(
        voltaje
    );


    /*
       Agregar temperatura.
    */

    grafica.data.datasets[1].data.push(
        temperatura
    );


    /*
       Mantener únicamente
       los últimos 20 datos.
    */

    if (
        grafica.data.labels.length > 20
    ) {

        grafica.data.labels.shift();


        grafica.data.datasets.forEach(
            dataset => {

                dataset.data.shift();

            }
        );

    }


    grafica.update();

}


/* =====================================
   INICIO
   ===================================== */


/*
   Empezamos intentando conectar
   cada segundo.
*/

cambiarIntervalo(
    INTERVALO_CONECTADO
);


/*
   Revisar la conexión cada segundo,
   aunque no haya petición nueva.
*/

setInterval(
    verificarTiempoLimite,
    1000
);


/*
   Primera consulta inmediatamente.
*/

consultarSenal();

