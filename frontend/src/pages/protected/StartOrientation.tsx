import { useNavigate } from "react-router-dom";

import OrientationForm from "@/components/OrientationForm";

export default function StartOrientation() {
  const navigate = useNavigate();

  return <OrientationForm onBack={() => navigate("/")} />;
}
