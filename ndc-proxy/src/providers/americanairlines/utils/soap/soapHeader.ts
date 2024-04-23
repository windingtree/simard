import {FarelogixConfiguration} from '../../../../env';
import {Service} from 'typedi';

interface SoapMessageBuilderI {
    createSoapMessage(config: FarelogixConfiguration, payload: string): string;
}

@Service()
export class FarelogixSoapMessageBuilder implements SoapMessageBuilderI {
    public createSoapMessage(config: FarelogixConfiguration, payload: string): string {
        return `<SOAP-ENV:Envelope xmlns:SOAP-ENV="https://protect-eu.mimecast.com/s/3i9LClxoOcoOMMAVcEc8V3?domain=schemas.xmlsoap.org">
    ${this.createSoapHeaderXML(config)}
    <SOAP-ENV:Body>
        <ns1:XXTransaction xmlns:ns1="xxs">
            <REQ>
                ${payload}
            </REQ>
        </ns1:XXTransaction>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
    }

    private createTransactionControlXML(config: FarelogixConfiguration): string {
        return `<t:Transaction xmlns:t="xxs">
    <tc>
        <iden u="${config.username}" p="${config.password}" pseudocity="${config.agencyPCC}" agt="${config.agentName}" agtpwd="${config.agentPassword}" agy="${config.agencyIATA}" />
        <trace admin="Y">${config.fareLogixTrace}</trace>
        <script engine="${config.fareLogixScriptEngine}" name="${config.fareLogixScriptName}" />
    </tc>
</t:Transaction>`;
    }
    private createSoapHeaderXML(config: FarelogixConfiguration): string {
        return `<SOAP-ENV:Header>
     ${this.createTransactionControlXML(config)}
   </SOAP-ENV:Header>`;
    }

}

@Service()
export class FarelogixSandboxSoapMessageBuilder implements SoapMessageBuilderI {
    public createSoapMessage(config: FarelogixConfiguration, payload: string): string {
        return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tc="http://farelogix.com/flx/tc" xmlns:air="http://farelogix.com/flx/AirShoppingRQ" xmlns:aug="http://ndc.farelogix.com/aug">
    ${this.createSoapHeaderXML(config)}
    <soapenv:Body>
        <FlxTransaction>
            ${payload}
        </FlxTransaction>
    </soapenv:Body>
</soapenv:Envelope>`;
    }

    private createTransactionControlXML(config: FarelogixConfiguration): string {
        return  `<tc:TransactionControl>
         <tc:tc>
            <tc:iden u="${config.username}" p="${config.password}" pseudocity="${config.agencyPCC}" agt="${config.agentName}" agtpwd="${config.agentPassword}" agy="${config.agencyIATA}"/>
            <tc:trace>${config.fareLogixTrace}</tc:trace>
            <tc:script engine="${config.fareLogixScriptEngine}" name="${config.fareLogixScriptName}"/>
         </tc:tc>
      </tc:TransactionControl>`;
    }
    private createSoapHeaderXML(config: FarelogixConfiguration): string {
        return `<SOAP-ENV:Header>
     ${this.createTransactionControlXML(config)}
   </SOAP-ENV:Header>`;
    }

}

// @ts-ignore
function transactionControlForFarelogixSandbox(config: FarelogixConfiguration): string {
    return `<tc:TransactionControl>
         <tc:tc>
            <tc:iden u="${config.username}" p="${config.password}" pseudocity="${config.agencyPCC}" agt="${config.agentName}" agtpwd="${config.agentPassword}" agy="${config.agencyIATA}"/>
            <tc:trace>${config.fareLogixTrace}</tc:trace>
            <tc:script engine="${config.fareLogixScriptEngine}" name="${config.fareLogixScriptName}"/>
         </tc:tc>
      </tc:TransactionControl>`;
}

function transactionControl(config: FarelogixConfiguration): string {
    return `<t:Transaction xmlns:t="xxs">
    <tc>
        <iden u="${config.username}" p="${config.password}" pseudocity="${config.agencyPCC}" agt="${config.agentName}" agtpwd="${config.agentPassword}" agy="${config.agencyIATA}" />
        <trace admin="Y">${config.fareLogixTrace}</trace>
        <script engine="${config.fareLogixScriptEngine}" name="${config.fareLogixScriptName}" />
    </tc>
</t:Transaction>`;
}

function soapHeader(config: FarelogixConfiguration): string {
    return `<SOAP-ENV:Header>
     ${transactionControl(config)}
   </SOAP-ENV:Header>`;
}
// Falerogix sandbox environment has slightly different SOAP envelope structure vs airlines API gateways (e.g. AA or UA API gateways)
export function createSoapMessageForFarelogixSandbox(config: FarelogixConfiguration, payload: string): string {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tc="http://farelogix.com/flx/tc" xmlns:air="http://farelogix.com/flx/AirShoppingRQ" xmlns:aug="http://ndc.farelogix.com/aug">
    ${soapHeader(config)}
    <soapenv:Body>
        <FlxTransaction>
            ${payload}
        </FlxTransaction>
    </soapenv:Body>
</soapenv:Envelope>`;
}

export function createSoapMessage(config: FarelogixConfiguration, payload: string): string {
    return `<SOAP-ENV:Envelope xmlns:SOAP-ENV="https://protect-eu.mimecast.com/s/3i9LClxoOcoOMMAVcEc8V3?domain=schemas.xmlsoap.org">
    ${soapHeader(config)}
    <SOAP-ENV:Body>
        <ns1:XXTransaction xmlns:ns1="xxs">
            <REQ>
                ${payload}
            </REQ>
        </ns1:XXTransaction>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
}
