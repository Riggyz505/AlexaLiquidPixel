const net = require('net');
const dgram = require('dgram');


exports.handler = function(request, context) {
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Discover request", JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }
    else if (request.directive.header.namespace === 'Alexa.ColorController') {
        if (request.directive.header.name === 'SetColor') {
            log("DEBUG:", "Set Color Request", JSON.stringify(request));
            handleColorControl(request, context);
        }
    }
    else if (request.directive.header.namespace === 'Alexa.ColorTemperatureController') {
        log("DEBUG:", "Set Temp Request", JSON.stringify(request));
        handleColorTempControl(request, context);
    }
    else if (request.directive.header.namespace === 'Alexa.PercentageController') {
        log("DEBUG:", "Set Percent Request", JSON.stringify(request));
        handleDelayControl(request, context);
    }
    else if (request.directive.header.namespace === 'Alexa.ModeController') {
        log("DEBUG:", "Set Mode Request", JSON.stringify(request));
        handleModeControl(request, context);
    }

    function handleDiscovery(request, context) {
        var payload = {
            "endpoints": [
                //PUT YOUR ENDPOINT JSON IN HERE
            ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }

    function handlePowerControl(request, context) {

        // get device ID passed in during discovery
        var device_id = request.directive.endpoint.endpointId;
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;
        var powerResult;
        if (requestMethod === "TurnOn") {

            sendDataToPi(device_id, "POWER", true);
            powerResult = "ON";
        }
        else if (requestMethod === "TurnOff") {
            sendDataToPi(device_id, "POWER", false);
            powerResult = "OFF";
        }
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.PowerController",
                "name": "powerState",
                "value": powerResult,
                "timeOfSample": "2017-09-03T16:20:50.52Z", //retrieve from result.
                "uncertaintyInMilliseconds": 500
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: device_id
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
        context.succeed(response);
    }

    function handleColorControl(request, context) {
        // get device ID passed in during discovery
        var device_id = request.directive.endpoint.endpointId;
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.name = "Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;

        sendDataToPi(device_id, "COLOR", JSON.stringify(request.directive.payload.color));

        var contextResult = {
            "properties": [{
                "namespace": "Alexa.ColorController",
                "name": "color",
                "value": {
                    "hue": request.directive.payload.color.hue,
                    "saturation": request.directive.payload.color.saturation,
                    "brightness": request.directive.payload.color.brightness
                },
                "timeOfSample": "2019-07-03T16:20:50Z",
                "uncertaintyInMilliseconds": 500
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: device_id
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.ColorController ", JSON.stringify(response));
        context.succeed(response);
    }

    function handleColorTempControl(request, context) {
        // get device ID passed in during discovery
        var device_id = request.directive.endpoint.endpointId;
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;

        if (responseHeader.name == "SetColorTemperature") {
            sendDataToPi(device_id, "TEMP", request.directive.payload.colorTemperatureInKelvin);
            request.directive.endpoint.cookie.temp = request.directive.payload.colorTemperatureInKelvin;
        }
        else if (responseHeader.name == "IncreaseColorTemperature") {
            sendDataToPi(device_id, "TEMP", "add");
            //sendDataToPi(device_id, "TEMP", request.directive.endpoint.cookie.temp + 100);
            request.directive.endpoint.cookie.temp = request.directive.endpoint.cookie.temp + 100;
        }
        else if (responseHeader.name == "DecreaseColorTemperature") {
            sendDataToPi(device_id, "TEMP", "minus");
            //sendDataToPi(device_id, "TEMP", request.directive.endpoint.cookie.temp - 100);
            request.directive.endpoint.cookie.temp = request.directive.endpoint.cookie.temp - 100;

        }
        responseHeader.name = "Response";
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.ColorTemperatureController",
                "name": "colorTemperatureInKelvin",
                "value": request.directive.endpoint.cookie.temp,
                "timeOfSample": "2018-02-05T16:20:50.52Z",
                "uncertaintyInMilliseconds": 500
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: device_id
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.ColorTemperatureController ", JSON.stringify(response));
        context.succeed(response);
    }

    function handleDelayControl() {
        // get device ID passed in during discovery
        var device_id = request.directive.endpoint.endpointId;
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;

        if (responseHeader.name == "SetPercentage") {
            sendDataToPi(device_id, "DELAY", request.directive.payload.percentage);
            request.directive.endpoint.cookie.percent = request.directive.payload.percentage;
        }
        else if (responseHeader.name == "AdjustPercentage") {
            sendDataToPi(device_id, "DELAY", request.directive.endpoint.cookie.percent + request.directive.payload.percentageDelta);
            request.directive.endpoint.cookie.percent = request.directive.endpoint.cookie.percent + request.directive.payload.percentageDelta;
        }

        responseHeader.name = "Response";
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.PercentageController",
                "name": "percentage",
                "value": request.directive.endpoint.cookie.percent,
                "timeOfSample": "2017-02-03T16:20:50.52Z",
                "uncertaintyInMilliseconds": 500
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: device_id
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.PercentageController ", JSON.stringify(response));
        context.succeed(response);
    }

    function handleModeControl(request, context) {
        // get device ID passed in during discovery
        var device_id = request.directive.endpoint.endpointId;
        var requestMethod = request.directive.header.name;
        var responseHeader = request.directive.header;
        responseHeader.namespace = "Alexa";
        responseHeader.messageId = responseHeader.messageId + "-R";
        // get user token pass in request
        var requestToken = request.directive.endpoint.scope.token;

        var modeID = 0;

        switch (request.directive.payload.mode) {
            case "LightMode.Solid":
                modeID = 1;
                break;
            case "LightMode.Cloudy":
                modeID = 2;
                break;
            case "LightMode.Flash":
                modeID = 3;
                break;
            case "LightMode.Sweep":
                modeID = 4;
                break;
            case "LightMode.Twinkle":
                modeID = 5;
                break;
            case "LightMode.RandomTwinkle":
                modeID = 6;
                break;
            case "LightMode.RandomFlash":
                modeID = 7;
                break;
            case "LightMode.TheaterChase":
                modeID = 8;
                break;
            case "LightMode.Chroma":
                modeID = 9;
                break;
            case "LightMode.FadeIn":
                modeID = 10;
                break;
            case "LightMode.FadeOut":
                modeID = 11;
                break;
            case "LightMode.SuddenFlash":
                modeID = 12;
                break;
            case "LightMode.RandomBreath":
                modeID = 13;
                break;
            case "LightMode.Breath":
                modeID = 14;
                break;
            case "LightMode.FallingStars":
                modeID = 15;
                break;
            case "LightMode.ChristmasChase":
                modeID = 16;
                break;
            case "LightMode.Pong":
                modeID = 17;
                break;
            case "LightMode.Waterall":
                modeID = 18;
                break;
            case "LightMode.Lightning":
                modeID = 19;
                break;
            case "LightMode.Waves":
                modeID = 20;
                break;
            case "LightMode.Levels":
                modeID = 21;
                break;
            case "LightMode.Rain":
                modeID = 22;
                break;
            default:
                modeID = 1;
        }
        
        request.directive.endpoint.cookie.mode = modeID;

        sendDataToPi(device_id, "MODE", modeID);

        responseHeader.name = "Response";
        var contextResult = {
            "properties": [{
                "namespace": "Alexa.ModeController",
                "instance": "Light.LightMode",
                "name": "mode",
                "value": request.directive.payload.mode,
                "timeOfSample": "2017-02-03T16:20:50Z",
                "uncertaintyInMilliseconds": 0
            }]
        };
        var response = {
            context: contextResult,
            event: {
                header: responseHeader,
                endpoint: {
                    scope: {
                        type: "BearerToken",
                        token: requestToken
                    },
                    endpointId: device_id
                },
                payload: {}
            }
        };
        log("DEBUG", "Alexa.ModeController ", JSON.stringify(response));
        context.succeed(response);
    }
};

function sendDataToPi(id, requestType, data) {
    //the connection parameters
    var port = 0000; //PUT YOUR PORT NUMBER HERE
    var ip = "127.0.0.1"; //PUT YOUR EXTRERNAL IP HERE
    //make the message
    var message = Buffer.from(id + "-" + requestType + "-" + data);
    //then make a client and send the message
    var client = dgram.createSocket('udp4');
    client.connect(port, ip, (err) => {
        client.send(message, (err) => {
            client.close();
        });
    });
}
