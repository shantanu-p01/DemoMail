import { useState } from 'react';

function OTPForm({ setStep, email }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return; // Allow only numbers
    
    // Ensure OTP length does not exceed 6 digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Make the API call to verify the OTP
    try {
      const response = await fetch('https://mail.kubez.cloud/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP or OTP expired');
      }

      setLoading(false);
      // Only redirect to the target page if OTP verification is successful
      window.location.href = 'https://kubez.cloud'; // Redirect to the target page
    } catch (error) {
      setLoading(false);
      setError('Invalid OTP. Please try again.');
      setOtp(''); // Clear OTP input
      setStep(1); // Go back to email input step
    }
  };

  const isOtpValid = otp.length === 6; // Check if OTP is exactly 6 digits

  return (
    <div className="text-white flex justify-center items-center w-full">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Enter OTP</h2>
        <form onSubmit={handleSubmit} className="text-center">
          <div className="mb-4">
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={handleChange}
              className="w-full py-3 text-xl text-center bg-gray-700 text-white border border-gray-600 rounded-md"
              placeholder="XXXXXX"
              disabled={loading} // Disable input when loading
            />
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white rounded-md"
            disabled={loading || !isOtpValid} // Disable if OTP is not 6 digits or loading
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OTPForm;