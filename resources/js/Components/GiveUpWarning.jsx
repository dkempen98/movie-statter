import { useEffect, useRef, useState } from "react"
import { personImages } from "@/Helpers/tmdb_api.js";
import { FaMinusCircle, FaRegTimesCircle } from "react-icons/fa";
import {router} from "@inertiajs/react";

export default function GiveUpWarning({ category, open, close, giveUp }) {
    const refOne = useRef(null)

    function handleClickOutside(e) {
        if(e.target && refOne.current) {
            if(!refOne.current.contains(e.target)) {
                close()
            }
        }
    }

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true)
        return () => document.removeEventListener("click", handleClickOutside, true)
    }, [])

    return (
        <div>
            {open && (
                <div className='overlay'>
                    <div ref={refOne} className="give-up-container">
                        <div className="give-up-modal">
                            <h2>Give Up for { category.display_name }?</h2>
                            <p>
                                Are you sure you want to give up on this category?
                                <br/><br/>
                                Giving up will move you to the bottom of the leaderboard
                                and will not count towards any stats that are related to
                                game scoring
                            </p>
                            <div className="give-up-button-container">
                                <div className="give-up-button cancel" onClick={() => close()}>
                                    <FaRegTimesCircle /> Cancel
                                </div>
                                <div className="give-up-button" onClick={ () => giveUp() }>
                                    <FaMinusCircle /> Yes, Give Up
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
