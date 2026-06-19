import React, { useState } from 'react';
import { formatarDataDiaMesAno } from '../../utils/formatters';
import './Header.css';

interface HeaderProps {
  title: string;
  onExport?: () => void;
  onSave?: () => void;
  hasChanges?: boolean;
  saving?: boolean;
  date?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onExport,
  onSave,
  hasChanges = false,
  saving = false,
  date,
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  React.useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-left">
        <h1>
          <span className="title-bar" />
          {title}
        </h1>
        {date && (
          <span className="date-badge">{formatarDataDiaMesAno(new Date(date + 'T00:00:00'))}</span>
        )}
      </div>
      <div className="header-right">
        {onSave && (
          <button
            className={`action-btn ${hasChanges ? 'action-btn-save' : ''}`}
            onClick={onSave}
            disabled={!hasChanges || saving}
            aria-label="Salvar alterações"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
        {onExport && (
          <button className="action-btn" onClick={onExport} aria-label="Salvar imagem">
            Salvar imagem
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
