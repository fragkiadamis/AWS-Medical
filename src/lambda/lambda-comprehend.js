import { ComprehendMedical } from "@aws-sdk/client-comprehendmedical"

export const handler = async(event) => {
    const comprehend = new ComprehendMedical({ region: event['region'] });
    const response = await comprehend.detectEntitiesV2({Text: event['text']});
    
    let diseases = [];
    let medication = [];
    let anatomies = [];
    let treatmentProcedures = [];
    let protectedHealthInfo = [];
    
    for (const entity of response['Entities']) {
        if (entity['Category'] === 'MEDICAL_CONDITION')
            diseases.push(entity['Text']);
        if (entity['Category'] === 'MEDICATION')
            medication.push(entity['Text']);                
        if (entity['Category'] === 'ANATOMY')
            anatomies.push(entity['Text']);
        if (entity['Category'] === 'TEST_TREATMENT_PROCEDURE')
            treatmentProcedures.push(entity['Text']);
        if (entity['Category'] === 'PROTECTED_HEALTH_INFORMATION')
            protectedHealthInfo.push(entity['Text']);
    }

    return {
        diseases, medication, anatomies,
        treatmentProcedures, protectedHealthInfo
    };
};
