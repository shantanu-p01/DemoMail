import { useState } from 'react';
import EmailForm from './components/EmailForm.jsx';
import OTPForm from './components/OTPForm.jsx';

function App() {
  const [step, setStep] = useState(1); // 1 for email step, 2 for OTP step
  const [email, setEmail] = useState('');

  return (
    <div className="bg-gray-800 flex min-h-svh justify-center items-center h-svh min-w-swh w-swh">
      <div className="max-w-sm w-full m-2 rounded-lg shadow-lg">
        {step === 1 ? (
          <EmailForm setStep={setStep} setEmail={setEmail} />
        ) : (
          <OTPForm setStep={setStep} email={email} />
        )}
      </div>
    </div>
  );
}

export default App;