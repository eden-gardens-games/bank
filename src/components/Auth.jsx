import { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "../firebase";
import { TextField, Button, Container, Typography, Card, CardContent } from "@mui/material";

const referralCode = "BANK123"; // Change this to your known referral code

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: "",
    referralCode: "",
  });

  const [error, setError] = useState("");

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(""); // Clear error when switching modes
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (formData.password !== formData.repeatPassword) {
        setError("Passwords do not match!");
        return;
      }

      if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}/.test(formData.password)) {
        setError("Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.");
        return;
      }

      if (formData.referralCode !== referralCode) {
        setError("Invalid referral code.");
        return;
      }

      try {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        alert("Sign up successful!");
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        alert("Sign in successful!");
      } catch (err) {
        setError("Invalid email or password.");
      }
    }
  };

  return (
    <Container className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md shadow-lg p-5">
        <CardContent>
          <Typography variant="h5" className="text-center">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {isSignUp && (
              <>
                <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
                <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
              </>
            )}
            <TextField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required fullWidth />
            <TextField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required fullWidth />
            {isSignUp && (
              <>
                <TextField label="Repeat Password" type="password" name="repeatPassword" value={formData.repeatPassword} onChange={handleChange} required fullWidth />
                <TextField label="Referral Code" name="referralCode" value={formData.referralCode} onChange={handleChange} required fullWidth />
              </>
            )}
            <Button variant="contained" color="primary" type="submit" fullWidth>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <Typography className="text-center mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <Button onClick={toggleMode}>{isSignUp ? "Sign In" : "Sign Up"}</Button>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
