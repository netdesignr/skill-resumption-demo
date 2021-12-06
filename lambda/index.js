const Alexa = require('ask-sdk');
const axios = require('axios');
var isNavigate = false;
var isOrderCoffee = false;
var isOrderReady = false;
var sessionId = '';
var apiAccessToken = ''

/*
 ,
             "shouldEndSession": true
            
*/
const navResponse = {
             "outputSpeech": {
              "type": "PlainText",
              "text": "Starting Navigation.."
             },
             "directives": [
                 {
                      "type":"Navigation.SetDestination",
                      "destination":{
                          "name":"Day1",
                          "coordinate":{
                             "latitudeInDegrees": 47.615868,
                             "longitudeInDegrees": -122.339850
                          }
                      },
                      "transportationMode":"DRIVING"
                }
            ], 
             "sessionBehavior": {
                 "type": "SetSessionState",
                 "state": "BACKGROUNDED" 
            }
             
       };
const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
	},
	handle(handlerInput) {
		var speech = '';
		let permissionScopeAlreadyGranted = handlerInput.requestEnvelope.session.user.permissions.scopes['alexa::skill:resumption'].status;
		if(permissionScopeAlreadyGranted === "DENIED") {
		    speech = 'Welcome to skill resumption demo! To access this skill you need to enable skill resumption. Would you like to enable ?';
		}
		else{
		    speech = 'Welcome to skill resumption demo! would you like to navigate to Amazon Day1 ?'; 
            isNavigate = true;
		}
		return handlerInput.responseBuilder
			.speak(speech)
			.withShouldEndSession(false)
			.getResponse();
	}
}

const YesIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
			&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
			&& !isNavigate;
	},
	handle(handlerInput) {
		console.log("Hit Yes Intent! Requesting for permission");
		return handlerInput.responseBuilder
			.addDirective({
				type: "Connections.SendRequest",
				name: "AskFor",
				payload: {
					"@type": "AskForPermissionsConsentRequest",
					"@version": "1",
					"permissionScope": "alexa::skill:resumption"
				},
				token: ""
			})
			.getResponse();
	}
}

const NoIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
			&& Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
	},
	handle(handlerInput) {
		return {
			"outputSpeech": {
				"type": "PlainText",
				"text": 'OK, do not background resumption skill.'
			},
			'shouldEndSession': true
		};
	}
}

const CancelAndStopIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
			&& (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
				|| Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent');
	},
	handle(handlerInput) {
		const speakOutput = 'Bye, ending sample resumption skill.';
		return handlerInput.responseBuilder
			.speak(speakOutput)
			.withShouldEndSession(true)
			.getResponse();
	}
};

const NavigateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'NavigateIntent' 
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent')
            && isNavigate;
    },
  handle(handlerInput) {
        var speech = '';
		let permissionScopeAlreadyGranted = handlerInput.requestEnvelope.session.user.permissions.scopes['alexa::devices:all:geolocation:read'].status;
		var isGeoSupported = handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Geolocation;
		if(permissionScopeAlreadyGranted === "DENIED") {
		   speech = 'Enable location permissions on Alexa app. follow the display card for more details';  
		    return handlerInput.responseBuilder
		     .speak(speech)
		    .withAskForPermissionsConsentCard(['alexa::devices:all:geolocation:read'])
		    .withShouldEndSession(true)
		    .getResponse();
		}
		if(!isGeoSupported){
		    speech = 'Your device does not support geo location, please use this skill on your alexa app';  
		   return handlerInput.responseBuilder
		     .speak(speech)
		    .withShouldEndSession(true)
		    .getResponse();
		}
        sessionId = handlerInput.requestEnvelope.session.sessionId;
        apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
        console.log("Resume navigate sessionId", sessionId);
        console.log("Resume navigate apiAccessToken", apiAccessToken);
        const speakOutput = 'Starting Navigation';
        console.log('Starting Navigation to Day1: ' + JSON.stringify(navResponse));
        return navResponse;
    }
};

const OrderCoffeeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'OrderCoffeeIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent')
            && isOrderCoffee
    },
  async handle(handlerInput) {
        const speakOutput = 'Sure, placing you order at Starbucks on 4th street. I will notify your order status shortly.';
        isOrderReady = true;
        sessionId = handlerInput.requestEnvelope.session.sessionId;
        apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
        console.log("Resume order coffee sessionId", sessionId);
        console.log("Resume order coffee apiAccessToken", apiAccessToken);
        return handlerInput.responseBuilder
			.speak(speakOutput)
			.withSessionBehavior("BACKGROUNDED")
			.getResponse();
    }
};

const SessionResumedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionResumedRequest';
    },
    async handle(handlerInput) {
        console.log("isOrderCoffee", isOrderCoffee);
        var speakOutput = ' ';
        if (!isOrderCoffee){
            speakOutput = 'Hi there! this is resumption demo, would you like to pick up coffee on your way ?';
            isOrderCoffee = true;
           //handlerInput.responseBuilder.withShouldEndSession(false);
        }
        if (isOrderReady)
        {
            speakOutput = 'Hi there! your coffee order is ready, drive up to the pick up spot. Thanks for using skill resumption demo. Bye!';
            handlerInput.responseBuilder.withShouldEndSession(true);
        }
        return handlerInput.responseBuilder
			.speak(speakOutput)
			.withSessionBehavior("BACKGROUNDED")
			.getResponse();
    }
};

const ErrorHandler = {
	canHandle() {
		return true;
	},
	handle(handlerInput, error) {
		console.log(`Error handled: ${error.stack}`);
		return handlerInput.responseBuilder
		
			.withShouldEndSession(true)
			.getResponse();
	}
};

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function buildSpeechletResponse(output, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        shouldEndSession,
    };
}


// TODO replace link below with public documentation
// https://wiki.labcollab.net/confluence/display/Doppler/Session+Lifecycle+control+API+-+Resume
async function requestResumption(sessionId, apiAccessToken) {
    // TODO replace endpoint once in prod
    console.log("before post")
    return new Promise((resolve, reject) => {
        axios.post(`https://api.amazonalexa.com/v1/_customSkillSessions/${sessionId}/resume/`, null, {
            headers: {
                "Authorization": `Bearer ${apiAccessToken}`,
                "Content-Type": 'application/json'
            }
        }).then((response) => {
            console.log("returned")
            resolve(response);
        }).catch((err) => {
            reject(err);
        })
    });
}

const skillHandler = Alexa.SkillBuilders.custom()
	.addRequestHandlers(
		LaunchRequestHandler,
		YesIntentHandler,
		NoIntentHandler,
		CancelAndStopIntentHandler,
		SessionResumedRequestHandler,
		OrderCoffeeIntentHandler,
		NavigateIntentHandler
	)
	.addRequestInterceptors(
		{
			// TODO remove logging
			process(handlerInput) {
				console.log('Request:', JSON.stringify(handlerInput, null, 2));
			}
		},
		{
			// TODO remove once updated SDK available; get date for this
			process(handlerInput) {
				const responseBuilder = handlerInput.responseBuilder;
				const response = responseBuilder.getResponse();
				responseBuilder.withSessionBehavior = function (state) {
					response.sessionBehavior = {
						"type": "SessionBehavior.SetSessionState",
						"state": state
					};
					return responseBuilder;
				};
			}
		}
	)
	.addResponseInterceptors(
		{
			// TODO remove logging
			process(handlerInput, response) {
				console.log('response:', JSON.stringify(response, null, 2));
			}
		}
	)
	.addErrorHandlers(
		ErrorHandler
	)
	.lambda();

exports.handler = (event, context, callback) => {
    
    // Receives permissions response
    if (event.request.type === 'Connections.Response') {
        console.log('Received link result body: ' + JSON.stringify(event.request));
        const sessionAttributes = {};

        var code = event.request.status.code;
        var speech = '';
        if (code === '200' || code === '204') {
            var status = event.request.payload.status;
            isNavigate = true;
            speech = "Thanks! would you like to navigate to Amazon Day1 ?";
            callback(null,
                buildResponse(sessionAttributes,
                    buildSpeechletResponse(speech, false)
                )
            );
        }
        if (code === '400' || code === '404') {
            speech = "Invalid Link Request. Error was : " + event.request.status.message;
            callback(null,
                buildResponse(sessionAttributes,
                    buildSpeechletResponse(speech, false)
                )
            );
        }
        if (code === '500') {
            speech = "Internal error when following a link. Error was : " + event.request.status.message;
            callback(null,
                buildResponse(sessionAttributes,
                    buildSpeechletResponse(speech, false)
                )
            );
        }
    }
    if(event.request.type === 'Alexa.Authorization.Grant'){
        	console.log('OAuth Grant Code:', event.request.body.grant.code);
    }

	skillHandler(event, context, (err, response) => {
		callback(err, response);
	});
}