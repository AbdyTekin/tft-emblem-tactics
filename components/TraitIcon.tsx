import { traitIcon } from '@/lib/assets';

/** Trait icon tinted with the current text color (the icon is used as a mask). Decorative: pair it with the trait name. */
export default function TraitIcon({ trait, className = '' }: { trait: string; className?: string }) {
    const mask = `url(${traitIcon(trait)})`;
    return (
        <span
            aria-hidden="true"
            className={`${className} relative inline-block align-middle bg-current`}
            style={{
                width: '20px',
                height: '20px',
                maskImage: mask,
                WebkitMaskImage: mask,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
            }}
        />
    );
}
