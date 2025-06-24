const TemplateConfig = {
    templates: {
        client: {
            default: `I'm a headhunter communicating with a client.
{Chat}
Now, provide only the answer I will send now to the client without any additional comments!`,
            followup: `I'm following up with a client.
{Chat}
Now, provide only the answer I will send now to the client without any additional comments!`
        },
        candidate: {
            default: `I'm a headhunter, and below I'll share the chat I'm having with a candidate.
{Chat}
Now, provide only the answer I will send now to the candidate without any additional comments!`,
            followup: `I'm following up with a candidate.
{Chat}
Now, provide only the answer I will send now to the candidate without any additional comments!`
        }
    }
};