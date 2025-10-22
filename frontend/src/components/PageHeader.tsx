import { motion } from 'framer-motion';

interface PageHeaderProps {
    icon?: string;
    title: string;
    subtitle?: string;
    color?: string;
}

const PageHeader = ({
    icon,
    title,
    subtitle,
    color = '#1e40af'
}: PageHeaderProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
        >
            <h1 className="mb-1" style={{
                color: color,
                fontWeight: 'bold',
                fontSize: 'clamp(1.5rem, 5vw, 2rem)'
            }}>
                {icon && `${icon} `}{title}
            </h1>
            {subtitle && (
                <p className="text-muted d-none d-md-block" style={{ fontSize: '0.9rem' }}>
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
};

export default PageHeader;
