import { motion } from 'framer-motion';

const imgMarcoDelgadoVerde1 = "/assets/864b827d37a64e1ef35951b48f48a7d196f73bfc.png";
const imgMarcoDelgadoMorado1 = "/assets/d94620b583929c8d0a6fb5418d8c875b924f8c60.png";

const categories = [
  { name: "Objeto", count: 54, color: "verde" },
  { name: "Transporte", count: 5, color: "morado" },
  { name: "Material", count: 2, color: "verde" },
  { name: "Bebida", count: 6, color: "morado" },
  { name: "Alimento", count: 7, color: "verde" },
  { name: "Animal", count: 11, color: "morado" },
  { name: "Planta", count: 3, color: "verde" },
  { name: "Gesto", count: 4, color: "morado" },
  { name: "Expresión", count: 5, color: "verde" },
  { name: "Cuerpo", count: 6, color: "morado" },
  { name: "Para referirse", count: 120, color: "verde" },
  { name: "Vestimenta", count: 5, color: "morado" },
  { name: "Accesorio", count: 9, color: "verde" },
  { name: "Fantasía", count: 1, color: "morado" },
  { name: "Juego", count: 1, color: "verde" },
];

export default function CategoryList() {
  return (
    <div className="w-full flex flex-col items-center py-24 bg-[#fffce6] relative overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[900px] mb-16 text-center"
      >
        <h2 className="font-heritage text-[#bb4c18] text-[48px] uppercase font-bold tracking-wide mb-4">
          Categorías
        </h2>
        <p className="font-outfit text-black text-[26px]">
          Aprende las palabras y expresiones típicas del Caribe colombiano clasificadas por temáticas. ¡Explora nuestra riqueza verbal!
        </p>
      </motion.div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="flex flex-wrap justify-center max-w-[1700px] gap-x-4 gap-y-4 px-10"
      >
        {categories.map((cat, index) => (
          <motion.div 
            key={index}
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.4 } }
            }}
            whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
            className="relative w-[335px] h-[118px] flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 p-3">
               <div className="relative w-full h-full">
                  <img 
                    alt="" 
                    className="absolute max-w-none pointer-events-none" 
                    style={{ 
                      width: "120%", 
                      height: "300%", 
                      left: "-10%", 
                      top: "-100%",
                      objectFit: "contain"
                    }}
                    src={cat.color === "verde" ? imgMarcoDelgadoVerde1 : imgMarcoDelgadoMorado1} 
                  />
               </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-0.5 z-10 font-trattatello relative" style={{ top: '12px' }}>
              <p className="text-[#fffce6] text-[34px] tracking-wide m-0 leading-tight">
                {cat.name}
              </p>
              <p className="text-[rgba(255,252,230,0.85)] text-[20px] m-0 font-heritage tracking-wide">
                ({cat.count})
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
