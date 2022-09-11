import { useGoogleLogin } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import { useAuth } from '../../contexts/AuthContext';

import './GoogleSignIn.css';

const GoogleSignIn = () => {
  const { logIn } = useAuth();

  const continueWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('http://localhost:3000/api/auth/google', {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
          }),
        });
  
        const body = await res.json();
  
        // User record may have been created (200) or just retrieved (201)
        if (res.status === 200 || res.status === 201) {
          return logIn(body);
        }
  
        if (res.status == 500) {
          throw new Error(body.message);
        }
      } catch (err) {
        // TODO: Remove in production env
        console.log(err);
      }
    },
    onError: (errorResponse) => console.log(errorResponse),
    flow: 'implicit',
    scope: 'profile email',
  });

  return (
    <button
      className="googleSignIn"
      type="button"
      onClick={continueWithGoogle}
    >
      <FontAwesomeIcon className="googleSignIn__icon" icon={faGoogle} />
      SIGN IN WITH GOOGLE
    </button>
  );
};

export default GoogleSignIn;
