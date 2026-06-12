import { useEffect, useRef, useState } from "react"
import { personImages } from "@/Helpers/tmdb_api.js";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function ImagePreviewer({ personId, open, close }) {
    const refOne = useRef(null)

    const [images, setImages] = useState(null)
    const [imageNum, setImageNum] = useState(0)
    const [loading, setLoading] = useState(true)

    function toggleImage(step) {
        const arrLength = images.length - 1;
        if(step > 0) {
            if(imageNum + step > arrLength) {
                setImageNum(0)
                return
            }
        } else {
            if(imageNum + step < 0) {
                setImageNum(arrLength)
                return
            }
        }
        setImageNum(imageNum + step)
    }

    function handleClickOutside(e) {
        if(e.target && refOne.current) {
            if(!refOne.current.contains(e.target)) {
                close()
            }
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function loadImages() {
            setLoading(true);
            const data = personId ? await personImages(personId) : null;
            if (cancelled) return;
            setImages(data?.profiles ?? null);
            setLoading(false);
        }

        loadImages();

        return () => {
            cancelled = true;
        };
    }, [personId]);


    useEffect(() => {
        document.addEventListener("click", handleClickOutside, true)
        return () => document.removeEventListener("click", handleClickOutside, true)
    }, [])

    return (
        <div>
            {open && (
                <div className='overlay'>
                    <div ref={refOne} className="preview-modal">
                        {loading && (
                            <div>Loading...</div>
                        )}
                        {images?.length > 0 && (
                            <div>
                                <div
                                    className="person-image"
                                    style={images[imageNum].file_path ?
                                        {
                                            backgroundImage: `url(https://image.tmdb.org/t/p/w780${images[imageNum].file_path})`,
                                            aspectRatio: images[0].aspect_ratio,
                                        }
                                        : {}
                                    }
                                />
                                {images?.length > 1 && (
                                    <div className="preview-button-container">
                                        <div
                                            onClick={() => toggleImage(-1)}
                                            className="preview-button"
                                            style={{
                                                borderRadius: "0 0 0 10px",
                                            }}
                                        >
                                            <FaArrowLeft />
                                        </div>
                                        <div
                                            onClick={() => toggleImage(1)}
                                            className="preview-button"
                                        >
                                            <FaArrowRight />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="modal-close" onClick={() => close()}>X</div>
                    </div>
                </div>
            )}
        </div>
    )
}
