import {Component} from "react";
import {menuButton} from "../lib/variants.js";

// Catches render/runtime errors in its subtree so a crash surfaces a readable
// message (and a console error) instead of a silent black screen — notably on
// the lobby->match handoff, where a bad snapshot would otherwise blank the view.
// Pass onReset to offer a recovery action.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {error: null};
    }

    static getDerivedStateFromError(error) {
        return {error};
    }

    componentDidCatch(error, info) {
        console.error("[DomeBreak] render crash:", error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0a0b0d] text-center p-8">
                <div className="db-notch db-scan relative max-w-[460px] border border-danger bg-[rgba(20,10,10,0.96)] p-7 text-left">
                    <div className="font-display text-danger text-2xl font-bold tracking-[2px] uppercase mb-3 flex items-center gap-2.5">
                        <span className="db-led db-led-live" />
                        Match Error
                    </div>
                    <p className="text-dim text-[13px] mb-4">
                        The match view hit a render error. Full details are in the console.
                    </p>
                    <pre className="db-notch-sm text-left text-[11px] text-faint bg-sunk border border-line p-3 overflow-auto max-h-[220px] whitespace-pre-wrap font-mono">
                        {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                    </pre>
                    {this.props.onReset && (
                        <button
                            className={menuButton()}
                            style={{marginTop: 16}}
                            onClick={() => {
                                this.setState({error: null});
                                this.props.onReset();
                            }}
                        >
                            Return to Menu
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
