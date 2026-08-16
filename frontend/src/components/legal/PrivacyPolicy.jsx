import { Link } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

const TITOLARE = 'Tony Randazzo';
const EMAIL_CONTATTO = 'randazzotony1@gmail.com';
const REGIONE_SUPABASE = 'West EU (Irland)';
const ULTIMO_AGGIORNAMENTO = '16 agosto 2026';

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th className="py-2 pr-4 text-left align-top font-medium text-fg">{label}</th>
      <td className="py-2 align-top">{children}</td>
    </tr>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg text-sm font-bold">
              S
            </span>
            <span className="text-base font-semibold tracking-tight text-fg">Schemaroid</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Informativa sulla privacy</h1>
        <p className="mt-2 text-sm text-fg-subtle">
          Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-fg-muted">
          Questa informativa descrive quali dati raccoglie Schemaroid, perché li raccoglie e come
          sono conservati, ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
        </p>

        <Section title="1. Titolare del trattamento">
          <p>
            Il titolare del trattamento è <strong className="text-fg">{TITOLARE}</strong>.
          </p>
          <p>
            Per qualsiasi richiesta relativa ai propri dati è possibile scrivere a{' '}
            <strong className="text-fg">{EMAIL_CONTATTO}</strong>.
          </p>
        </Section>

        <Section title="2. Quali dati raccogliamo">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                <Row label="Account registrato">
                  Nome utente e password. La password non viene mai conservata in chiaro: ne è
                  salvata solo una versione cifrata con l&apos;algoritmo bcrypt, dalla quale non è
                  possibile risalire alla password originale.
                </Row>
                <Row label="Accesso come ospite">
                  Un identificativo casuale generato dal browser. Non è associato ad alcun dato
                  personale e non consente di risalire alla tua identità.
                </Row>
                <Row label="Contenuti creati">
                  Progetti, schemi, forme e collegamenti: titoli, descrizioni, colori, dimensioni,
                  posizioni ed eventuali link inseriti.
                </Row>
                <Row label="Immagini caricate">
                  I file che carichi nelle forme. Vedi l&apos;avvertenza al punto 4.
                </Row>
              </tbody>
            </table>
          </div>
          <p>
            <strong className="text-fg">Non</strong> raccogliamo indirizzi email, numeri di
            telefono, dati di pagamento né dati appartenenti a categorie particolari.
          </p>
          <p>
            Il sito <strong className="text-fg">non utilizza strumenti di analisi, profilazione,
            pubblicità o tracciamento</strong>, né di terze parti né propri. Non vengono creati
            profili degli utenti e non esistono processi decisionali automatizzati.
          </p>
        </Section>

        <Section title="3. Perché trattiamo questi dati e su quale base giuridica">
          <p>
            I dati sono trattati per la sola finalità di erogare il servizio: permetterti di creare
            un account, accedere e conservare gli schemi che realizzi.
          </p>
          <p>
            La base giuridica è l&apos;esecuzione del contratto di cui sei parte
            (art. 6, par. 1, lett. b del GDPR): senza questi dati il servizio non può funzionare.
          </p>
        </Section>

        <Section title="4. Dove sono conservati e chi può accedervi">
          <p>
            Tutti i dati risiedono esclusivamente su <strong className="text-fg">Supabase</strong>,
            che ospita il database e l&apos;archivio dei file, nella regione {REGIONE_SUPABASE}.
            Non vengono trasferiti, venduti o comunicati ad altri soggetti, e non circolano su altri
            servizi.
          </p>
          <p>
            Per il funzionamento del sito ci avvaliamo di tre fornitori, che agiscono come
            responsabili del trattamento:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong className="text-fg">Supabase</strong> — database e archiviazione file</li>
            <li><strong className="text-fg">Netlify</strong> — distribuzione dell&apos;interfaccia web</li>
            <li><strong className="text-fg">Render</strong> — esecuzione del server applicativo</li>
          </ul>
          <p>
            Questi fornitori possono conservare log tecnici di accesso (ad esempio indirizzo IP e
            data della richiesta) per finalità di sicurezza e diagnostica, secondo le rispettive
            informative. Se i loro server si trovano fuori dallo Spazio Economico Europeo, il
            trasferimento avviene sulla base delle garanzie previste dagli articoli 44 e seguenti
            del GDPR.
          </p>
          <p className="rounded-lg border border-warning-line bg-warning-soft px-4 py-3 text-warning-fg">
            <strong>Avvertenza sulle immagini.</strong> Le immagini caricate nelle forme sono
            conservate in un archivio ad accesso pubblico: chiunque disponga del link diretto al
            file può visualizzarle, anche senza avere un account. Il link non è indicizzato né
            divulgato, ma non è protetto da autenticazione. Si consiglia di non caricare immagini
            contenenti informazioni riservate o dati personali.
          </p>
        </Section>

        <Section title="5. Per quanto tempo li conserviamo">
          <p>
            I dati sono conservati finché l&apos;account resta attivo. Alla richiesta di
            cancellazione, account e contenuti associati vengono eliminati definitivamente.
          </p>
          <p>
            Gli account creati tramite accesso come ospite restano legati al browser da cui sono
            stati generati: cancellando i dati del sito dal browser si perde l&apos;accesso ai
            relativi contenuti, che possono comunque essere rimossi su richiesta.
          </p>
        </Section>

        <Section title="6. Misure di sicurezza adottate">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Le password sono protette con <strong className="text-fg">bcrypt</strong> e non sono
              conoscibili né dal titolare né da chi gestisce i server.
            </li>
            <li>
              Tutte le comunicazioni tra browser e server avvengono su
              <strong className="text-fg"> HTTPS</strong>, con certificati gestiti dalle piattaforme
              di hosting.
            </li>
            <li>
              L&apos;accesso avviene tramite token firmati con scadenza (7 giorni per gli account
              registrati, 30 per gli ospiti).
            </li>
            <li>
              Il server verifica a ogni richiesta che i dati appartengano a chi li domanda: non è
              possibile accedere a progetti o schemi altrui.
            </li>
            <li>
              Le chiamate al server sono accettate soltanto dal dominio ufficiale del sito.
            </li>
          </ul>
          <p>
            Nessuna misura può garantire una sicurezza assoluta. In caso di violazione dei dati che
            comporti un rischio elevato per i tuoi diritti, provvederemo alle comunicazioni previste
            dagli articoli 33 e 34 del GDPR.
          </p>
        </Section>

        <Section title="7. Archiviazione locale nel browser">
          <p>
            Il sito <strong className="text-fg">non utilizza cookie</strong>. Impiega
            l&apos;archiviazione locale del browser per quattro informazioni, tutte necessarie al
            funzionamento e nessuna a fini di tracciamento:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>il token che mantiene attiva la sessione;</li>
            <li>l&apos;identificativo dell&apos;accesso come ospite;</li>
            <li>la preferenza fra tema chiaro e scuro;</li>
            <li>gli ultimi colori utilizzati nell&apos;editor.</li>
          </ul>
          <p>
            Trattandosi di elementi strettamente necessari o di preferenze impostate da te, non è
            richiesto alcun banner di consenso. Puoi rimuoverle in qualsiasi momento cancellando i
            dati del sito dalle impostazioni del browser: comporterà la disconnessione.
          </p>
        </Section>

        <Section title="8. I tuoi diritti">
          <p>
            Puoi esercitare in qualsiasi momento i diritti previsti dagli articoli 15-22 del GDPR:
            accesso ai dati, rettifica, cancellazione, limitazione del trattamento, portabilità e
            opposizione.
          </p>
          <p>
            Nome utente e password sono modificabili direttamente dal profilo. Per la
            cancellazione dell&apos;account, l&apos;esportazione dei dati o qualsiasi altra
            richiesta è necessario scrivere a <strong className="text-fg">{EMAIL_CONTATTO}</strong>:
            provvederemo entro un mese dal ricevimento.
          </p>
          <p>
            Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati
            personali (<span className="text-fg">www.garanteprivacy.it</span>).
          </p>
        </Section>

        <Section title="9. Modifiche a questa informativa">
          <p>
            Eventuali aggiornamenti saranno pubblicati su questa pagina, con indicazione della data
            di revisione. Se le modifiche saranno sostanziali, ne daremo avviso all&apos;interno del
            servizio.
          </p>
        </Section>

        <div className="mt-10 border-t border-line pt-6">
          <Link to="/login" className="text-sm font-medium text-accent hover:underline">
            ← Torna all&apos;accesso
          </Link>
        </div>
      </main>
    </div>
  );
}
