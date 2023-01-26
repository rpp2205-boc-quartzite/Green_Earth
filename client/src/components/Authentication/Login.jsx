import React, { useState } from "react";
import { Link } from 'react-router-dom';

export default function Login(props) {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(email);
    }

    return (
        <div className='auth-form-container'>
          <form className='login-form' onSubmit={handleSubmit}>
            <h2>Login</h2>
              <label htmlFor='email'>Email</label>
                <input value={email} onChange={(event) => setEmail(event.target.value)}type='email' placeholder='Enter Email' id='email' name='email' />
              <label htmlFor='password'>Password</label>
                <input value={pass} onChange={(event) => setPass(event.target.value)} type='password' placeholder='Enter Password' id='password' name='password' />
              <Link to='driverview'>
                <button type='submit'>Log In</button>
              </Link>  
            <Link to='/register'>
              <button className='link-btn'>Don't have an account? Register here.</button>
            </Link>  
          </form>
        </div>
    )
}