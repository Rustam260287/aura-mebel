
async function testChat() {
  const endpoint = 'http://localhost:3000/api/chat/message';
  const testMessage = {
    message: 'привет',
    history: [],
  };

  console.log(`Sending test message to ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    });

    console.log(`Status Code: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Test failed with an error response:');
      console.error(errorBody);
      return;
    }

    const jsonResponse = await response.json();
    console.log('Test successful! API Response:');
    console.log(jsonResponse);

    if (jsonResponse.reply && jsonResponse.reply.toLowerCase().includes('устал')) {
        console.error("\n[!] Test FAILED: The AI is still giving tired responses.");
    } else if(jsonResponse.reply) {
        console.log("\n[✓] Test PASSED: The AI response seems appropriate.");
    } else {
        console.error("\n[!] Test FAILED: The response format is incorrect.");
    }


  } catch (error) {
    console.error('Failed to connect to the local server. Is it running?');
    console.error(error.message);
  }
}

testChat();
