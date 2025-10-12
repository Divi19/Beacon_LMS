import s from './Button.module.css';

export default function Button({ variant = 'teal', className = '', ...props }){
  const variantClass =
    variant === 'green' ? s.green :
    variant === 'orange' ? s.orange :
    variant === 'aqua'   ? s.aqua   :
    s.teal;
  return <button {...props} className={[s.btn, variantClass, className].join(' ')} />;
}
