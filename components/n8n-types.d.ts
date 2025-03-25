declare namespace JSX {
    interface IntrinsicElements {
        'n8n-demo': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
            workflow: string;
            theme?: string;
        }, HTMLElement>;
    }
} 