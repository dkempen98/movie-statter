export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src="/images/moon_trip.svg"
            alt="Hit the Marquee"
            className={className}
            {...props}
        />
    );
}
