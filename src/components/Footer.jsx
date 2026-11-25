import '../index.css';

export default function Footer(){

    return( 
        <footer className="home-footer">
            <span>© {new Date().getFullYear()} NoWifi. Alla rättigheter förbehållna.</span>
            <a href="mailto:contact@nowifi.example">Kontakta oss</a>
        </footer>
      );

}