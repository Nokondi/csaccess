import React, { useState } from "react";
import { LoginForm } from "./LoginForm";

export const Auth: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  return (
    <LoginForm onToggleMode={toggleMode} isRegisterMode={isRegisterMode} />
  );
};
