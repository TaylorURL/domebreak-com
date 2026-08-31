// react-bits — StarBorder (JS + Tailwind variant). Two radial-gradient "stars"
// sweep along the top and bottom edges to trace an animated glowing border.
// Vendored from reactbits.dev; kept faithful to the upstream animation, with
// `radius` and `innerClassName` exposed so the inner surface can match a host
// design system (the upstream defaults reproduce the original pill look). The
// star-movement keyframes/animations live in web/src/index.css.
const StarBorder = ({
    as: Component = "button",
    className = "",
    color = "var(--gold)",
    speed = "6s",
    thickness = 1,
    radius = 20,
    innerClassName = "bg-linear-to-b from-btn-bg to-btn-bg-2 border border-line text-text text-[16px] py-4 px-6",
    children,
    style,
    ...rest
}) => {
    return (
        <Component
            className={`relative inline-block overflow-hidden ${className}`}
            style={{padding: `${thickness}px 0`, borderRadius: radius, ...style}}
            {...rest}
        >
            <div
                className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
                style={{background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed}}
            />
            <div
                className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
                style={{background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed}}
            />
            <div className={`relative z-1 text-center ${innerClassName}`} style={{borderRadius: radius}}>
                {children}
            </div>
        </Component>
    );
};

export default StarBorder;
