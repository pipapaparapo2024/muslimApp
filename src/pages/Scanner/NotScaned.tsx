import { PageWrapper } from "../../shared/PageWrapper";
import { useNavigate } from "react-router-dom";

export const NotScaned: React.FC = () => {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div>404 not scanned</div>
      <button onClick={() => navigate("/scanner")}> rescan</button>
    </PageWrapper>
  );
};
