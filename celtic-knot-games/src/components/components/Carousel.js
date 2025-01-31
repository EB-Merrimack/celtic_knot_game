import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../css/WelcomeCarousel.css';  // Custom styles if needed

/**
 * A carousel component that displays a sequence of items with a brief description.
 * Each item shows an image, a heading and a paragraph of text.
 * The carousel is set up to automatically change every 3 seconds, and the items
 * will loop indefinitely.
 * The carousel is also responsive and will resize depending on the size of the
 * screen.
 */
function WelcomeCarousel() {
    return (
        <Carousel 
            showArrows={false} 
            autoPlay={true} 
            infiniteLoop={true} 
            showThumbs={false} 
            showStatus={false}
            dynamicHeight={true}
            className="custom-carousel"
        >
            <div className="carousel-item">
                <div className="carousel-header">
                    <img src={require('../Visual assets/freestyle logo.png')} alt="Freestyle Mode" className="tiny-icon" />
                    <h2>Freestyle Mode</h2>
                <h3>
                    Express your creativity without any rules. Create your own unique Celtic knots and designs.
                </h3>
                
            </div>
            </div>
            <div className="carousel-item">
                <div className="carousel-header">
                    <img src={require('../Visual assets/linkervsknotter.png')} alt="Linker V Knotter Mode" className="tiny-icon" />
                    <h2>Linker V Knotter Mode</h2>
                <h3>
                    Take on various challenges and puzzles. Test your skills and improve your knotting techniques.
                </h3>
            </div>

            </div>
        </Carousel>
    );
}

export default WelcomeCarousel;
