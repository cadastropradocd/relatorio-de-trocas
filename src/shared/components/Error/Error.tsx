import './Error.css';

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ message, onRetry }) => {
  return (
    <div className="error" role="alert">
      <h2>Erro</h2>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-btn">
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default Error;
