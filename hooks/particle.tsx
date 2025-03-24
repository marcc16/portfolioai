'use client';
import { useCanvas } from '@/hooks/useCanvas';
import { useCallback, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  velocity: { x: number; y: number };
  radius: number;
  color: string;
  baseRadius: number;
  angle: number;
  angleSpeed: number;

  constructor(ctx: CanvasRenderingContext2D) {
    this.x = Math.random() * ctx.canvas.width;
    this.y = Math.random() * ctx.canvas.height;
    this.velocity = {
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5
    };
    this.baseRadius = Math.random() * 2 + 1;
    this.radius = this.baseRadius;
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = (Math.random() - 0.5) * 0.02;
    // Colores más modernos con tonos neón suaves
    const colors = [
      'rgba(94, 114, 235, 0.8)', // Azul neón
      'rgba(192, 97, 255, 0.8)',  // Morado neón
      'rgba(255, 89, 158, 0.8)'   // Rosa neón
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(ctx: CanvasRenderingContext2D) {
    this.angle += this.angleSpeed;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    
    // Efecto de "respiración" en el tamaño
    this.radius = this.baseRadius + Math.sin(this.angle) * 0.5;

    if (this.x < 0 || this.x > ctx.canvas.width) this.velocity.x *= -1;
    if (this.y < 0 || this.y > ctx.canvas.height) this.velocity.y *= -1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export function ParticleCanvas() {
  const particles = useRef<Particle[]>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    if (particles.current.length === 0) {
      particles.current = Array.from({ length: 70 }, () => new Particle(ctx));
    }

    // Fondo más oscuro para mejor contraste
    ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    particles.current.forEach(particle => {
      particle.update(ctx);
      particle.draw(ctx);
    });

    // Conexiones mejoradas con gradiente
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i; j < particles.current.length; j++) {
        const dx = particles.current[i].x - particles.current[j].x;
        const dy = particles.current[i].y - particles.current[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          ctx.beginPath();
          const gradient = ctx.createLinearGradient(
            particles.current[i].x,
            particles.current[i].y,
            particles.current[j].x,
            particles.current[j].y
          );
          gradient.addColorStop(0, particles.current[i].color.replace('0.8', `${0.15 * (1 - distance/150)}`));
          gradient.addColorStop(1, particles.current[j].color.replace('0.8', `${0.15 * (1 - distance/150)}`));
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.moveTo(particles.current[i].x, particles.current[i].y);
          ctx.lineTo(particles.current[j].x, particles.current[j].y);
          ctx.stroke();
        }
      }
    }
  }, []);

  const canvasRef = useCanvas(draw);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
    />
  );
}
