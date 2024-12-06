import { useState } from 'react';

function EmailForm({ setStep, setEmail }) {
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic email validation
    if (!emailInput || !/\S+@\S+\.\S+/.test(emailInput)) {
      setError('Please enter a valid email.');
      setLoading(false);
      return;
    }

    setEmail(emailInput);
    setError('');

    try {
      // Send OTP request to the backend
      const response = await fetch('https://mail.kubez.cloud/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setLoading(false);
      setStep(2); // Move to OTP step if email is valid
    } catch (error) {
      setError('Error sending OTP. Please try again.');
      setLoading(false);
    }
  };

  const isEmailValid = /\S+@\S+\.\S+/.test(emailInput); // Check if the email format is valid

  return (
    <div className="text-white flex justify-center items-center w-full">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Enter your Email</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md mb-4"
            placeholder="Your Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={loading} // Disable input when loading
          />
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white rounded-md"
            disabled={loading || !isEmailValid} // Disable if email is invalid or loading
          >
            {loading ? 'Sending OTP...' : 'Get OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmailForm;