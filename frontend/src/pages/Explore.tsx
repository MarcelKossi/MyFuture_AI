import { useNavigate } from "react-router-dom";

import AdviceSection from "@/components/AdviceSection";
import { useAuth } from "@/auth/useAuth";

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartOrientation = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/start-orientation" } });
      return;
    }

    navigate("/start-orientation");
  };

  return <AdviceSection onBack={() => navigate("/")} onStartOrientation={handleStartOrientation} />;
}
