import { useState } from 'react'
import { supabase } from '@/api/supabaseClient'

export default function SignupSurgery() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const signup = async () => {
    setMsg('Signing up…')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error(error)
      setMsg('ERROR: ' + error.message)
      return
    }

    setMsg('SUCCESS: user created')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Signup Surgery</h1>
      <input placeholder="email" onChange={e => setEmail(e.target.value)} />
      <br /><br />
      <input placeholder="password" type="password" onChange={e => setPassword(e.target.value)} />
      <br /><br />
      <button onClick={signup}>SIGN UP</button>
      <p>{msg}</p>
    </div>
  )
}

