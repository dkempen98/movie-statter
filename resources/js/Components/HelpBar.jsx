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
            <h1 className="title">Hit the Marquee</h1>
            <div className='help-button' onClick={() => setHelpModal(true)}>?</div>
            {helpModal && (
                <div className='overlay'>
                    <div ref={refOne} className="help-modal">
                        <div className="help-button" onClick={() => setHelpModal(false)}>X</div>
                        <h2>How to Play</h2>
                        <p>Each day features 5 categories. Search for a movie you think qualifies for each one and submit your guess.</p>
                        <p>If your movie fits the category, you'll earn points based on that day's scoring type which will be listed at the top of the page.</p>
                        <p>The same movie can be used for more than one category. There's no guess limit — try to maximise your score!</p>
                        <p>If a guess would result in 0 points, it will not be counted as a correct even if it fits the category. This is to ensure that instances where we have incomplete data do not count against you.</p>
                        <h2>About</h2>
                        <p>Hit the Marquee was created by an independent developer using the <a href="https://developer.themoviedb.org/docs">TMDB API</a></p>
                        <p>This is a work in progress</p>
                    </div>
                </div>
            )}
        </div>

    )


}