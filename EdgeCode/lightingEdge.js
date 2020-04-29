const dgram = require('dgram');
const SerialPort = require('serialport');
const kelvin_table = {
    1000: [255, 56, 0],
    1100: [255, 71, 0],
    1200: [255, 83, 0],
    1300: [255, 93, 0],
    1400: [255, 101, 0],
    1500: [255, 109, 0],
    1600: [255, 115, 0],
    1700: [255, 121, 0],
    1800: [255, 126, 0],
    1900: [255, 131, 0],
    2000: [255, 138, 18],
    2100: [255, 142, 33],
    2200: [255, 147, 44],
    2300: [255, 152, 54],
    2400: [255, 157, 63],
    2500: [255, 161, 72],
    2600: [255, 165, 79],
    2700: [255, 169, 87],
    2800: [255, 173, 94],
    2900: [255, 177, 101],
    3000: [255, 180, 107],
    3100: [255, 184, 114],
    3200: [255, 187, 120],
    3300: [255, 190, 126],
    3400: [255, 193, 132],
    3500: [255, 196, 137],
    3600: [255, 199, 143],
    3700: [255, 201, 148],
    3800: [255, 204, 153],
    3900: [255, 206, 159],
    4000: [255, 209, 163],
    4100: [255, 211, 168],
    4200: [255, 213, 173],
    4300: [255, 215, 177],
    4400: [255, 217, 182],
    4500: [255, 219, 186],
    4600: [255, 221, 190],
    4700: [255, 223, 194],
    4800: [255, 225, 198],
    4900: [255, 227, 202],
    5000: [255, 228, 206],
    5100: [255, 230, 210],
    5200: [255, 232, 213],
    5300: [255, 233, 217],
    5400: [255, 235, 220],
    5500: [255, 236, 224],
    5600: [255, 238, 227],
    5700: [255, 239, 230],
    5800: [255, 240, 233],
    5900: [255, 242, 236],
    6000: [255, 243, 239],
    6100: [255, 244, 242],
    6200: [255, 245, 245],
    6300: [255, 246, 247],
    6400: [255, 248, 251],
    6500: [255, 249, 253],
    6600: [254, 249, 255],
    6700: [252, 247, 255],
    6800: [249, 246, 255],
    6900: [247, 245, 255],
    7000: [245, 243, 255],
    7100: [243, 242, 255],
    7200: [240, 241, 255],
    7300: [239, 240, 255],
    7400: [237, 239, 255],
    7500: [235, 238, 255],
    7600: [233, 237, 255],
    7700: [231, 236, 255],
    7800: [230, 235, 255],
    7900: [228, 234, 255],
    8000: [227, 233, 255],
    8100: [225, 232, 255],
    8200: [224, 231, 255],
    8300: [222, 230, 255],
    8400: [221, 230, 255],
    8500: [220, 229, 255],
    8600: [218, 229, 255],
    8700: [217, 227, 255],
    8800: [216, 227, 255],
    8900: [215, 226, 255],
    9000: [214, 225, 255],
    9100: [212, 225, 255],
    9200: [211, 224, 255],
    9300: [210, 223, 255],
    9400: [209, 223, 255],
    9500: [208, 222, 255],
    9600: [207, 221, 255],
    9700: [207, 221, 255],
    9800: [206, 220, 255],
    9900: [205, 220, 255],
    10000: [207, 218, 255],
    10100: [207, 218, 255],
    10200: [206, 217, 255],
    10300: [205, 217, 255],
    10400: [204, 216, 255],
    10500: [204, 216, 255],
    10600: [203, 215, 255],
    10700: [202, 215, 255],
    10800: [202, 214, 255],
    10900: [201, 214, 255],
    11000: [200, 213, 255],
    11100: [200, 213, 255],
    11200: [199, 212, 255],
    11300: [198, 212, 255],
    11400: [198, 212, 255],
    11500: [197, 211, 255],
    11600: [197, 211, 255],
    11700: [197, 210, 255],
    11800: [196, 210, 255],
    11900: [195, 210, 255],
    12000: [195, 209, 255]
}
const port = 0000; //CHANGE THIS NUMBER TO THE PORT YOU ARTE FORWARDING
const server = dgram.createSocket('udp4');

//the server code
server.on('listening', () => {
    const address = server.address();
    console.log(`Server listening ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
    console.log(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    parseAndSend(msg)
});

server.bind(port);

//the serialports
// CHANGE THE BAUD AND SERIAL ADDRESS TO FIT WHAT YOUR LIGHTS NEED
// ADD AS MANY AS YOU NEED, JUST REMEMBER TO UPDATE HOW MANY PARAMTERS YOU HAVE
var origLight = new SerialPort("/dev/ttyACM1", { baudRate: 9600 });
var faceLight = new SerialPort("/dev/ttyACM0", { baudRate: 9600 });
var panelLight = new SerialPort("/dev/ttyACM3", { baudRate: 4800 });
//the partameters realted to each serialport
var ids = ["original_id", "face_id", "panel_id"];
var prevColors = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; //past RGB values for all lights
var prevTemps = [7000, 7000, 7000]; //7000 is the max kelvin of the Alexa color temp handler
var prevDelays = [37, 37, 37]; //37 is a reasonable delay for all modes
var prevModes = [1, 1, 1]; //mode 1 is solid

function parseAndSend(rawData) {
    var dataString = rawData.toString().split("-");
    var id = dataString[0];
    var type = dataString[1];
    var data = dataString[2];
    var generatedMessage = "";
    // show the data
    console.log(id + " " + type + " " + data)
    // switch through types of data
    switch (type) {
        case "POWER":
            if (data == 'true') {
                if ((prevColors[ids.indexOf(id)][0] + prevColors[ids.indexOf(id)][1] + prevColors[ids.indexOf(id)][2]) <= 10) {
                    generatedMessage = "T0C0R255G255B255M1D0X0S0~";
                }
                else {
                    generatedMessage = "T0C0R" + prevColors[ids.indexOf(id)][0] + "G" + prevColors[ids.indexOf(id)][1] + "B" + prevColors[ids.indexOf(id)][2] + "M1D" + prevDelays[ids.indexOf(id)] + "X0S0~";
                }
            }
            else {
                generatedMessage = "T0C0R000G000B000M0D0X0S0~";
            }
            break;
        case "COLOR":
            var hsb = JSON.parse(data);
            var rgb = HSVtoRGB((hsb.hue / 360), hsb.saturation, hsb.brightness);
            console.log("HSV: " + (hsb.hue / 360) + "," + hsb.saturation + "," + hsb.brightness);
            console.log("RGB: " + rgb.r + "," + rgb.g + "," + rgb.b);
            prevColors[ids.indexOf(id)][0] = rgb.r;
            prevColors[ids.indexOf(id)][1] = rgb.g;
            prevColors[ids.indexOf(id)][2] = rgb.b;
            generatedMessage = "T0C0R" + prevColors[ids.indexOf(id)][0] + "G" + prevColors[ids.indexOf(id)][1] + "B" + prevColors[ids.indexOf(id)][2] + "M" + prevModes[ids.indexOf(id)] + "D" + prevDelays[ids.indexOf(id)] + "X0S0~";
            break;
        case "TEMP":
            if (data == "add") {
                prevTemps[ids.indexOf(id)] += 100;
            }
            else if (data == "minus") {
                prevTemps[ids.indexOf(id)] -= 100;
            }
            else {
                prevTemps[ids.indexOf(id)] = data;
                prevColors[ids.indexOf(id)][0] = kelvin_table[prevTemps[ids.indexOf(id)]][0];
                prevColors[ids.indexOf(id)][1] = kelvin_table[prevTemps[ids.indexOf(id)]][1];
                prevColors[ids.indexOf(id)][2] = kelvin_table[prevTemps[ids.indexOf(id)]][2];
            }
            console.log(prevTemps[ids.indexOf(id)]);
            generatedMessage = "T0C0R" + prevColors[ids.indexOf(id)][0] + "G" + prevColors[ids.indexOf(id)][1] + "B" + prevColors[ids.indexOf(id)][2] + "M" + prevModes[ids.indexOf(id)] + "D" + prevDelays[ids.indexOf(id)] + "X0S0~";
            break;
        case "DELAY":
            prevDelays[ids.indexOf(id)] = parseInt(Math.max(1, Math.min((100 - data), 100)) / 100 * 255);
            generatedMessage = "T0C0R" + prevColors[ids.indexOf(id)][0] + "G" + prevColors[ids.indexOf(id)][1] + "B" + prevColors[ids.indexOf(id)][2] + "M" + prevModes[ids.indexOf(id)] + "D" + prevDelays[ids.indexOf(id)] + "X0S0~";
            break;
        case "MODE":
            prevModes[ids.indexOf(id)] = data;
            generatedMessage = "T0C0R" + prevColors[ids.indexOf(id)][0] + "G" + prevColors[ids.indexOf(id)][1] + "B" + prevColors[ids.indexOf(id)][2] + "M" + prevModes[ids.indexOf(id)] + "D" + prevDelays[ids.indexOf(id)] + "X0S0~";
            break;
        default:
            console.log("No matching type found!");
    }
    //send it to the respective asset
    sendRespectiveCommand(ids.indexOf(id), generatedMessage);
}

function sendRespectiveCommand(id, message) {
    console.log(ids[id] + ": " + message);
    switch (id) {
        case 0:
            origLight.write(message);
            break;
        case 1:
            faceLight.write(message);
            break;
        case 2:
            panelLight.write(message);
            break;
        //ADD MORE CASES HERE FOR EACH SERIALPORT YOU ADD
        default:
            console.log("No matching id found!");
    }
}

//The code that converts the HSB(HSV) value to the RGB value used by the light assets
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}