import type { BlogPost } from "@/lib/types";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

export const posts: BlogPost[] = [
  {
    slug: "how-to-choose-your-first-luxury-watch",
    title: "How to Choose Your First Luxury Watch",
    excerpt:
      "Case size, movement, style and budget — a calm, practical guide to buying the watch you'll still love in twenty years.",
    coverImage: img("1604242692760-2f7b0c26856d"),
    author: "Arjun Mehta",
    date: "2026-09-18",
    readingTime: "7 min read",
    category: "Buying Guide",
    content:
      "Buying your first luxury watch is a milestone. For many, it marks a promotion, a wedding, a graduation or simply the moment you decided that the object on your wrist should mean something. It is also, for most people, a significant purchase — which is why it pays to slow down and approach it with a little structure rather than an impulse.\n\nStart with how you will actually wear it. Be honest about your week. If you spend most days in an office and most weekends outdoors, a versatile steel sports watch on a bracelet will serve you far better than a delicate dress watch that only comes out twice a year. The best first watch is usually the one that fits into the life you already have, not the one you imagine.\n\nNext, think about size. Case diameter is only part of the story; lug-to-lug length — the distance from the top of the watch to the bottom — determines whether it overhangs your wrist. As a rough guide, wrists under 16cm suit cases of 34–38mm, while wrists of 17–19cm comfortably wear 39–42mm. Thickness matters too: anything under 11mm will slip beneath a shirt cuff without complaint.\n\nThen comes the movement. Quartz watches are accurate, affordable to maintain and ready to wear at a moment's notice. Automatic watches, wound by the motion of your wrist, offer the romance of a living mechanism and a sweeping seconds hand, but require occasional servicing. Neither is 'better' — they simply suit different temperaments. We explore the difference in depth in our quartz vs automatic guide.\n\nDon't overlook the details that separate a good watch from a great one: a sapphire crystal rather than mineral glass, applied rather than printed indices, a solid bracelet with a quality clasp, and a meaningful warranty. These are the things you'll notice every day, long after the excitement of the purchase fades.\n\nFinally, set a budget and give yourself permission to stay within it. In the ₹15,000 to ₹1,20,000 range, today's watches offer finishing and reliability that would have been unthinkable a generation ago. Try a few on, live with the photos for a week, and choose the one you keep coming back to. That's usually the right answer.",
  },
  {
    slug: "quartz-vs-automatic-which-is-right-for-you",
    title: "Quartz vs Automatic: Which Is Right for You?",
    excerpt:
      "One runs on a crystal, the other on a spring. We unpack accuracy, maintenance, feel and value so you can choose with confidence.",
    coverImage: img("1524805444758-089113d48a6d"),
    author: "Meera Iyer",
    date: "2026-08-27",
    readingTime: "6 min read",
    category: "Watch School",
    content:
      "Every watch needs a heart, and for most of the last half-century that heart has been one of two things: a quartz crystal or a mechanical mainspring. The debate between them can feel tribal among enthusiasts, but the truth is more nuanced — and more interesting.\n\nA quartz movement uses a battery to send current through a tiny sliver of quartz, which vibrates at precisely 32,768 times per second. A circuit counts those vibrations and advances the hands once every second. The result is extraordinary accuracy — typically within 15 seconds a month — along with durability, slim cases and very little maintenance beyond a battery every few years.\n\nAn automatic movement, by contrast, is a miniature machine of springs, gears and jewels. A weighted rotor spins as you move, winding the mainspring, which releases its energy through an escapement that ticks several times a second. It is less accurate than quartz — a few seconds a day is excellent — but it never needs a battery and has a smooth, sweeping seconds hand that many find mesmerising.\n\nSwiss quartz deserves special mention. Movements made to Swiss standards tend to use higher-grade components, better shock protection and more robust construction, which is why we chose a Swiss quartz chronograph for our flagship MyWatch Aurora. For a complicated function like a chronograph, quartz also delivers precise fractional-second timing at a far more accessible price.\n\nOwnership differs too. A quartz watch can sit in a drawer for months and still show the right time. An automatic will stop after a day or two off the wrist, though many owners enjoy the small ritual of setting it again. Automatics benefit from servicing every five to seven years; quartz watches mostly need a fresh battery and a gasket check.\n\nSo which should you choose? If you want grab-and-go reliability, precision and value, quartz is hard to beat. If you appreciate craftsmanship, heritage and the idea of wearing something alive, an automatic will reward you every time you glance at it. Many collectors eventually own both — and that's perhaps the best answer of all.",
  },
  {
    slug: "caring-for-your-dive-watch",
    title: "Caring for Your Dive Watch",
    excerpt:
      "Salt, sand and sun take their toll. Simple habits that keep your diver water-tight, legible and looking new for decades.",
    coverImage: img("1526045431048-f857369baa09"),
    author: "Kabir Rao",
    date: "2026-07-14",
    readingTime: "5 min read",
    category: "Care & Maintenance",
    content:
      "A dive watch is built to be used — that's the whole point. But even the toughest tool watch appreciates a little care, especially if it spends its weekends in seawater and its weekdays on a desk. A few simple habits will keep it reliable and beautiful for decades.\n\nAlways check the crown before you get wet. On most divers the crown screws down onto a threaded tube, compressing a gasket to keep water out. Make sure it is fully tightened every time you set the time or date, and never operate the crown or chronograph pushers underwater unless the manufacturer explicitly allows it.\n\nRinse after every swim in the sea or pool. Salt crystals and chlorine are abrasive and can degrade gaskets over time. A gentle rinse under lukewarm fresh water — with the crown screwed down — followed by a pat dry with a soft cloth is all it takes. Rotate the bezel while rinsing to flush out any sand trapped beneath it.\n\nRespect temperature and pressure. Jumping from a hot tub into a cold pool, or wearing your watch in a sauna, causes metal and rubber to expand and contract at different rates, which can compromise the seals. Likewise, a 'water resistance' rating is tested under static conditions; a high-speed dive into water creates momentary pressure spikes far beyond it.\n\nHave the water resistance tested annually if you dive regularly, and every two to three years if you mostly swim. Gaskets are inexpensive to replace and are the single most important factor in keeping water out. Automatic divers will also benefit from a full service every five to seven years.\n\nFinally, store it well. Keep your watch away from strong magnetic fields like speakers and laptop clasps, and if you have a rubber strap, wipe it down to remove sunscreen, which can discolour it over time. Treat it well, and your diver will be ready for every adventure you take it on.",
  },
  {
    slug: "the-return-of-the-integrated-bracelet",
    title: "The Return of the Integrated Bracelet",
    excerpt:
      "Born in the 1970s, the integrated-bracelet sports watch is having its biggest moment yet. Here's why it endures — and how we reimagined it.",
    coverImage: img("1609587312208-cea54be969e7"),
    author: "Arjun Mehta",
    date: "2026-10-05",
    readingTime: "6 min read",
    category: "Design & Heritage",
    content:
      "In the early 1970s, the Swiss watch industry was in crisis. Cheap, accurate quartz watches were flooding in from Japan, and traditional watchmakers were searching for a reason to exist. Their answer was radical: a steel sports watch, priced like gold, designed with the confidence of a piece of architecture.\n\nThe defining feature of these watches was the integrated bracelet. Rather than attaching a strap between two lugs, designers made the bracelet flow directly out of the case, so watch and bracelet read as a single sculpted object. Faceted bezels, alternating brushed and polished surfaces and textured dials completed the look. 'Sports-luxe' was born.\n\nFor decades these designs remained the preserve of a handful of houses, with waiting lists to match. But over the past few years, the integrated-bracelet watch has exploded in popularity. Part of the appeal is versatility: it looks as natural with a t-shirt as with a tailored suit. Part of it is tactility — a well-made integrated bracelet drapes on the wrist like fabric.\n\nThe challenge is that true integrated design is difficult and expensive to manufacture well. Each link must be machined and finished by hand to match the case, and tolerances are unforgiving: a poorly made bracelet rattles, pinches hair and catches the light unevenly. Cutting corners shows immediately.\n\nWhen we designed the MyWatch Aurora Chronograph, we set out to bring that experience to a far wider audience without compromise. Its 41mm case flows into a bracelet finished with the same alternating satin and polished surfaces, closed by a butterfly clasp that disappears beneath the links. A deep black dial, sapphire crystal and Swiss quartz chronograph movement complete a watch that honours the 1970s while feeling entirely modern.\n\nTrends come and go, but the integrated bracelet has now survived half a century of them. That's because, at its best, it represents something timeless: the idea that a tool can also be a jewel. We think it's here to stay.",
  },
];
