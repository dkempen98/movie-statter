import { useEffect, useRef, useState } from "react"

export default function HelpBar() {
    
    const refOne = useRef(null)
    const [helpModal, setHelpModal] = useState(false)

    function handleClickOutside(e) {
        if(e.target && refOne.current) {
            if(!refOne.current.contains(e.target)) {
                setHelpModal(false)
            }
        }
    }

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true)

        return () => {
            document.removeEventListener("click", handleClickOutside, true)
        }
    }, [])

    
    return (
        <div className="help-bar">
            <h1 className="title">Film Grid</h1>
            <div className='help-button' onClick={() => setHelpModal(true)}>?</div>
            {helpModal && (
                <div className='overlay'>
                    <div ref={refOne} className="help-modal">
                        <div className="help-button" onClick={() => setHelpModal(false)}>&#10006;</div>
                        <h2>How to Play</h2>
                        <p>Select a movie for each square that has the corresponding people in its cast or crew.</p>
                        <p>Each answer given, right or wrong, will count as a guess. You have can guess as many times as you want - A perfect game is 9 guesses</p>
                        <p>Unlike many other grid games, the same movie CAN be used more than once. This is to prevent using certain movies from making the grid impossible.</p>
                        <h2>About</h2>
                        <p>Film Grid was created by an independent developer using the <a href="https://developer.themoviedb.org/docs">TMDB API</a></p>
                        <p><a href="https://www.freepik.com/free-vector/theater-stage-with-red-velvet-open_3924743.htm#query=theater%20stage&position=21&from_view=keyword&track=ais">background image by macrovector</a> on Freepik</p>
                    </div>
                </div>
            )}
        </div>

    )


}