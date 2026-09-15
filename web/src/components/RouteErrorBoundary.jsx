import {Component} from "react";
import {cn} from "../lib/cn.js";
import {button} from "../lib/variants.js";

// The routed pages load as their own chunks, so any one of them can fail to
// arrive after the page around it has already rendered. React treats that as a
// render error, and an error with no boundary over it unmounts the whole tree —
// the reader is left on a blank page with the navigation gone too. This holds
// the failure to the route it happened on and says what happened.
export default class RouteErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {failed: false};
    }

    static getDerivedStateFromError() {
        return {failed: true};
    }

    // A reader who moves to another page gets that page rather than the failure
    // they were already shown.
    componentDidUpdate(prevProps) {
        if (this.state.failed && prevProps.resetKey !== this.props.resetKey) this.setState({failed: false});
    }

    render() {
        if (!this.state.failed) return this.props.children;

        return (
            <div className="relative flex min-h-dvh items-center justify-center bg-bg px-5 text-text">
                <div className="max-w-[560px] text-center">
                    <h1 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] leading-[1.1] font-bold uppercase">
                        This page did not load
                    </h1>
                    <p className="mt-4 text-[15px] leading-relaxed text-dim">
                        Part of the site failed to arrive. Reload the page and it should come back.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className={cn(button({variant: "primary", size: "lg"}))}
                        >
                            Reload the Page
                        </button>
                        <a href="#/" className={cn(button({variant: "ghost", size: "lg"}))}>
                            Back to the Home Page
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
