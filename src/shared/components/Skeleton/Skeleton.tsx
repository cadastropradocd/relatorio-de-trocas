import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
};

export const SkeletonKPI: React.FC = () => (
  <div className="skeleton-kpi" aria-hidden="true">
    <Skeleton width="60%" height="0.875rem" />
    <Skeleton width="80%" height="1.5rem" />
    <Skeleton width="50%" height="0.75rem" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 9 }) => (
  <div className="skeleton-table" aria-hidden="true">
    <div className="skeleton-table-header">
      <Skeleton width="20%" height="1rem" />
      <Skeleton width="15%" height="1rem" />
      <Skeleton width="15%" height="1rem" />
      <Skeleton width="15%" height="1rem" />
      <Skeleton width="15%" height="1rem" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div className="skeleton-table-row" key={i}>
        <Skeleton width="25%" height="1.25rem" />
        <Skeleton width="12%" height="1.25rem" />
        <Skeleton width="12%" height="1.25rem" />
        <Skeleton width="15%" height="1.25rem" />
        <Skeleton width="10%" height="1.25rem" />
      </div>
    ))}
  </div>
);

export default Skeleton;
