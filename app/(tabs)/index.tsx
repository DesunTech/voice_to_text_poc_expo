import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export default function HomeScreen() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Tap the button to start speaking');
  const [error, setError] = useState('');
  const [partialResults, setPartialResults] = useState(''); // Track partial results separately initially

  useEffect(() => {
    // Define event handlers
    const onSpeechStart = (e: any) => {
      console.log('onSpeechStart: ', e);
      setStatus('Listening...');
      setIsListening(true);
      setError('');
      setPartialResults(''); // Clear partial results on start
    };

    const onSpeechEnd = (e: any) => {
      console.log('onSpeechEnd: ', e);
      setStatus('Processing...');
      setIsListening(false);
    };

    const onSpeechError = (e: any) => {
      console.log('onSpeechError: ', e);
      setError(JSON.stringify(e.error));
      setStatus('Error');
      setIsListening(false);
    };

    const onSpeechResults = (e: any) => {
      console.log('onSpeechResults: ', e);
      if (e.value && e.value.length > 0) {
        // Append the final result to the existing text
        setText(prevText => prevText + (prevText ? ' ' : '') + e.value[0]);
      }
      setStatus('Tap the button to start speaking'); // Reset status after final result
      setPartialResults(''); // Clear partial results after final result
    };

    const onSpeechPartialResults = (e: any) => {
      console.log('onSpeechPartialResults: ', e);
      if (e.value && e.value.length > 0) {
        setPartialResults(e.value[0]); // Store the latest partial result
        // Update text input dynamically with partial result appended
        // This handles the case where the user started typing first
        setText(prevText => {
           // Find the start of the last partial result appended
           const lastPartialIndex = prevText.lastIndexOf(partialResults);
           // If the previous partial result is found at the end, replace it
           if (lastPartialIndex !== -1 && lastPartialIndex + partialResults.length === prevText.length) {
               return prevText.substring(0, lastPartialIndex) + e.value[0];
           } else {
               // Otherwise, append the new partial result (potentially after typed text)
               return prevText + (prevText ? ' ' : '') + e.value[0];
           }
        });
      }
    };

    // Add listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    // Cleanup function
    return () => {
      // Remove all listeners and destroy the voice instance
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [partialResults]); // Re-run effect slightly differently based on logic needing partialResults

  const startListening = async () => {
    try {
      // Reset states before starting
      setError('');
      setPartialResults('');
      // Don't clear `text` here to allow Keyboard -> Voice transition
      await Voice.start('en-US');
      console.log('Voice recognition started');
    } catch (e) {
      console.error('Error starting voice recognition: ', e);
      setError(JSON.stringify(e));
      setStatus('Error starting');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      console.log('Voice recognition stopped');
      setIsListening(false);
      setStatus('Tap the button to start speaking'); // Reset status after stopping
    } catch (e) {
      console.error('Error stopping voice recognition: ', e);
      setError(JSON.stringify(e));
      setStatus('Error stopping');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Clear partial results tracking when user types manually
  const handleTextInputChange = (newText: string) => {
      // If the user is typing manually while listening might have been active,
      // we might want to reset partialResults tracking to avoid conflicts,
      // although the current logic tries to handle appending correctly.
      // For simplicity now, let's assume typing clears the expectation of continuous speech replacing text.
      // setPartialResults(''); // Optional: Decide if manual typing should clear partial tracking
      setText(newText);
  }


  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{status}</Text>
      <TextInput
        style={styles.textInput}
        multiline
        onChangeText={handleTextInputChange} // Use the wrapper
        value={text}
        placeholder="Speak or type here..."
        editable={!isListening} // Optionally disable editing while listening, but requirement allows mixing
      />
      <Button
        title={isListening ? 'Stop Listening' : 'Start Listening'}
        onPress={toggleListening}
      />
      {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: Platform.OS === 'android' ? 40 : 0, // Adjust margin for Android status bar
  },
  textInput: {
    height: 150,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    textAlignVertical: 'top', // Ensures text starts from the top on Android
  },
  statusText: {
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  // Remove unused styles like titleContainer, stepContainer, reactLogo
});
