const submitButton = document.getElementById('submit-button');

// Display AWS Medical Comprehension results
const displayComprehension = results => {
    let text = '';
    for (const entity in results) {
        text += `${entity}:\n`
        text += `${results[entity].join(', ')}`
        text += '\n\n';
    }

    // Create the necessary elements to display the detected entities
    const main = document.querySelector('main');
    const wrapper = document.createElement('div');
    const comprehensionTextArea = document.createElement('textarea');
    const comprehensionLabel = document.createElement('label');

    // Create the elemnets' attributes, add classes etc...
    wrapper.id = 'comprehensionWrapper';
    wrapper.classList.add('.mb-3');

    // Comprehension input label
    comprehensionLabel.for = 'comprehensionArea';
    comprehensionLabel.innerHTML = 'Transcription Entities';

    // Comprehension input
    comprehensionTextArea.id = 'comprehensionArea';
    comprehensionTextArea.classList.add('form-control');
    comprehensionTextArea.style = 'height: 300px';
    comprehensionTextArea.value = text;

    // Add the elemnts n the DOM
    wrapper.appendChild(comprehensionLabel);
    wrapper.appendChild(comprehensionTextArea);
    main.appendChild(wrapper);
} 

// POST form data
const submitData = (data, endpoint) =>
    new Promise((resolve, reject) => {
        // Send request to the AWS API Gateway, the promise will return the response once it is fetched
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(res => res.json())
            .then(data => resolve(data))
            .catch(err => reject(err));
    });

// Submit the form
submitButton.addEventListener('click', async e => {
    e.preventDefault();

    // Delete previous display of comprehension entities
    let comprehension = document.getElementById('comprehensionWrapper');
    if (comprehension)
        comprehension.parentNode.removeChild(comprehension);
    
    const data = {
        'region': document.getElementById('region').value,
        'text': document.getElementById('transcriptionArea').value
    }

    try {
        const res = await submitData(data, 'https://jpsnztgy7e.execute-api.us-east-1.amazonaws.com/dev');
        displayComprehension(res);
    } catch (error) {
        console.log(`Error ${error}`);
    }
});
