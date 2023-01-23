import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./lib/prisma";

export async function appRoutes(app: FastifyInstance) {
  // cria a rota passando uma função como segundo parâmetro
  app.post("/habits", async (request) => {
    // utiliza o zod pra validar os dados
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { title, weekDays } = createHabitBody.parse(request.body);

    // startOf() pra zerar as horas
    const today = dayjs().startOf("day").toDate();

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });
  });

  app.get("/day", async (request) => {
    // qual o dia que eu quero buscar as informações
    const getDayParams = z.object({
      // 'coerce' converte string em uma data
      date: z.coerce.date(),
    });

    // vai receber como um query param
    const { date } = getDayParams.parse(request.query);

    const parsedDate = dayjs(date).startOf("day");
    // pega o dia da semana
    const weekDay = parsedDate.get("day");

    // buscar os hábitos possíveis daquele dia
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          // pega os hábitos que a data de criação é menor ou igual que a data atual
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    });

    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      },
    });

    const completedHabits = day?.dayHabits.map((dayHabit) => {
      return dayHabit.habit_id;
    }) ?? []

    return {
      possibleHabits,
      completedHabits,
    };
  });

  // completar / não-completar um hábito
  // método patch para mudar um status
  app.patch("/habits/:id/toggle", async (request) => {
    // id => route param => parâmetro de identificação
    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    });

    const { id } = toggleHabitParams.parse(request.params);

    // para verificar que a pessoa está completando o hábito da data em que ela está, não uma data antiga
    const today = dayjs().startOf("day").toDate();

    // para que crie no bd apenas os dias em que hábitos foram completados
    let day = await prisma.day.findUnique({
      where: {
        date: today,
      },
    });
    // cria o dia (variável 'day') caso ele ainda não tenha sido criado
    if (!day) {
      day = await prisma.day.create({
        data: {
          date: today,
        },
      });
    }

    // busca um registro no bd, na tabela day_habits para ver se o usuário já tinha marcado o hábito como completo nesse dia em questão
    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        },
      },
    });

    // se o hábito estiver marcado como completo, remove a marcação
    if (dayHabit) {
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        },
      });
    } else {
      // se não, completa o hábito neste dia
      await prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        },
      });
    }
  });

  app.get("/summary", async () => {
    // query mais complexa, mais condições, relacionamentos => SQL na mão (raw)
    // SQL na mão (raw SQL) utiliza a sintaxe do banco de dados que você for utilizar, no caso aqui SQLite
    // $queryRaw => SQL na mão
    const summary = await prisma.$queryRaw`
        SELECT 
        D.id,
        D.date,
        (
            SELECT 
            cast(count(*) as float)
            FROM day_habits DH
            WHERE DH.day_id = D.id
        ) as completed,
        (
            SELECT
            cast(count(*) as float)
            FROM habit_week_days HWD
            JOIN habits H
            ON H.id = HWD.habit_id
            WHERE
            HWD.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
            AND H.created_at <= D.date
        ) as amount
        FROM days D
    `

    return summary
  })
}
