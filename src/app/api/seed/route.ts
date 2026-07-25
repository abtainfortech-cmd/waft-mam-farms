import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Check if data already exists - still seed staff and announcements if missing
    const existingFarms = await db.farm.count()
    const existingStaff = await db.staff.count()
    const existingAnnouncements = await db.announcement.count()

    if (existingFarms === 0) {

    // Create Farms
    const farm1 = await db.farm.create({
      data: {
        name: 'Kumasi Main Farm',
        location: 'Kumasi, Ashanti Region',
        address: 'Off Sofoline Road, Kumasi',
        phone: '+233 24 123 4567',
      },
    })

    const farm2 = await db.farm.create({
      data: {
        name: 'Accra Branch',
        location: 'Accra, Greater Accra Region',
        address: 'Dawhenya, Ningo-Prampram District',
        phone: '+233 20 987 6543',
      },
    })

    const farm3 = await db.farm.create({
      data: {
        name: 'Tamale Farm',
        location: 'Tamale, Northern Region',
        address: 'Kukuo, Tamale',
        phone: '+233 27 456 7890',
      },
    })

    // Create Flocks
    const flocks = [
      { farmId: farm1.id, name: 'Layer Flock A', birdType: 'Layer', breed: 'Lohmann Brown', birdCount: 2500, ageWeeks: 28 },
      { farmId: farm1.id, name: 'Layer Flock B', birdType: 'Layer', breed: 'ISA Brown', birdCount: 2000, ageWeeks: 45 },
      { farmId: farm1.id, name: 'Broiler Batch 1', birdType: 'Broiler', breed: 'Cobb 500', birdCount: 1500, ageWeeks: 4 },
      { farmId: farm2.id, name: 'Layer Flock C', birdType: 'Layer', breed: 'Lohmann Brown', birdCount: 3000, ageWeeks: 32 },
      { farmId: farm2.id, name: 'Cockerel Flock', birdType: 'Cockerel', breed: 'Sasso', birdCount: 800, ageWeeks: 12 },
      { farmId: farm3.id, name: 'Layer Flock D', birdType: 'Layer', breed: 'ISA Brown', birdCount: 1800, ageWeeks: 52 },
      { farmId: farm3.id, name: 'Broiler Batch 2', birdType: 'Broiler', breed: 'Ross 308', birdCount: 1000, ageWeeks: 3 },
    ]

    const createdFlocks = await Promise.all(
      flocks.map(f => db.birdFlock.create({
        data: { ...f, dateArrival: new Date(Date.now() - f.ageWeeks * 7 * 24 * 60 * 60 * 1000) },
      }))
    )

    // Create Customers
    const customers = [
      { name: 'Kingdom Eggs Ltd', phone: '+233 24 555 1000', location: 'Kumasi', customerType: 'Wholesale' },
      { name: 'Madam Ama Restaurant', phone: '+233 20 555 2000', location: 'Kumasi', customerType: 'Retail' },
      { name: 'Accra Fresh Market', phone: '+233 27 555 3000', location: 'Accra', customerType: 'Wholesale' },
      { name: 'Alhaji Ibrahim Trading', phone: '+233 50 555 4000', location: 'Tamale', customerType: 'Wholesale' },
      { name: 'University Cafeteria', phone: '+233 20 555 5000', location: 'Kumasi', customerType: 'Retail' },
      { name: 'Super Mart Ghana', phone: '+233 24 555 6000', location: 'Accra', customerType: 'Wholesale' },
    ]

    const createdCustomers = await Promise.all(
      customers.map(c => db.customer.create({ data: c }))
    )

    const now = new Date()

    // Create egg collection records (last 30 days)
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      date.setHours(8, 0, 0, 0)

      for (const farm of [farm1, farm2, farm3]) {
        const isToday = i === 0
        if (!isToday || farm.id === farm1.id || farm.id === farm2.id) {
          await db.dailyEggCollection.create({
            data: {
              farmId: farm.id,
              date: date.toISOString(),
              crateCount: Math.floor(Math.random() * 30) + 20,
              eggsPerCrate: 30,
              brokenCount: Math.floor(Math.random() * 10),
              soiledCount: Math.floor(Math.random() * 5),
              recordedBy: 'Kofi',
            },
          })
        }
      }
    }

    // Create egg sales
    for (let i = 0; i < 15; i++) {
      const date = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000)
      await db.eggSale.create({
        data: {
          customerId: createdCustomers[Math.floor(Math.random() * createdCustomers.length)].id,
          date: date.toISOString(),
          crateCount: Math.floor(Math.random() * 20) + 5,
          eggsPerCrate: 30,
          pricePerCrate: 35 + Math.floor(Math.random() * 10),
          totalAmount: 0,
          paymentStatus: i < 3 ? 'Unpaid' : i < 6 ? 'Partial' : 'Paid',
          amountPaid: 0,
          farmId: [farm1.id, farm2.id][Math.floor(Math.random() * 2)],
          recordedBy: 'Kwame',
          notes: '',
        },
      })
    }

    // Update egg sale totals
    const eggSales = await db.eggSale.findMany()
    for (const sale of eggSales) {
      const total = sale.crateCount * sale.pricePerCrate
      await db.eggSale.update({
        where: { id: sale.id },
        data: {
          totalAmount: total,
          amountPaid: sale.paymentStatus === 'Paid' ? total : sale.paymentStatus === 'Partial' ? total * 0.6 : 0,
        },
      })
    }

    // Create bird sales
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000)
      await db.birdSale.create({
        data: {
          customerId: createdCustomers[Math.floor(Math.random() * createdCustomers.length)].id,
          date: date.toISOString(),
          quantity: Math.floor(Math.random() * 50) + 20,
          weightPerBirdKg: 1.5 + Math.random() * 1.0,
          pricePerBird: 25 + Math.floor(Math.random() * 15),
          totalAmount: 0,
          paymentStatus: i < 2 ? 'Partial' : 'Paid',
          amountPaid: 0,
          farmId: [farm1.id, farm2.id, farm3.id][Math.floor(Math.random() * 3)],
          recordedBy: 'Kwame',
        },
      })
    }

    const birdSales = await db.birdSale.findMany()
    for (const sale of birdSales) {
      const total = sale.quantity * sale.pricePerBird
      await db.birdSale.update({
        where: { id: sale.id },
        data: {
          totalAmount: total,
          amountPaid: sale.paymentStatus === 'Paid' ? total : total * 0.5,
        },
      })
    }

    // Create expenses
    const expenseCategories = ['Feed', 'Medication', 'Utilities', 'Labour', 'Transport', 'Equipment', 'Maintenance', 'Other']
    for (let i = 0; i < 25; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const amount = Math.floor(Math.random() * 3000) + 200
      const isPaid = i > 3
      await db.expense.create({
        data: {
          farmId: [farm1.id, farm2.id, farm3.id][Math.floor(Math.random() * 3)],
          date: date.toISOString(),
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          description: `Farm supplies - ${expenseCategories[Math.floor(Math.random() * expenseCategories.length)].toLowerCase()}`,
          amount,
          paymentStatus: isPaid ? 'Paid' : 'Unpaid',
          dueDate: date.toISOString(),
          paidDate: isPaid ? date.toISOString() : null,
          vendor: ['Agric Supply Co.', 'Ghana Agro', 'Farmers Mart', 'Local Market'][Math.floor(Math.random() * 4)],
          recordedBy: 'Akua',
        },
      })
    }

    // Create mortality records
    for (let i = 0; i < 10; i++) {
      const date = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000)
      await db.birdMortality.create({
        data: {
          flockId: createdFlocks[Math.floor(Math.random() * createdFlocks.length)].id,
          farmId: [farm1.id, farm2.id, farm3.id][Math.floor(Math.random() * 3)],
          date: date.toISOString(),
          count: Math.floor(Math.random() * 8) + 1,
          cause: ['Disease', 'Heat stress', 'Predator', 'Unknown'][Math.floor(Math.random() * 4)],
          recordedBy: 'Kofi',
        },
      })
    }

    // Create feed records
    for (let i = 0; i < 20; i++) {
      const date = new Date(now.getTime() - i * 1.5 * 24 * 60 * 60 * 1000)
      await db.feedRecord.create({
        data: {
          farmId: [farm1.id, farm2.id, farm3.id][Math.floor(Math.random() * 3)],
          date: date.toISOString(),
          feedType: ['Layer mash', 'Broiler starter', 'Grower mash', 'Layer pellets'][Math.floor(Math.random() * 4)],
          bagsUsed: Math.floor(Math.random() * 10) + 2,
          bagWeightKg: 50,
          costPerBag: 180 + Math.floor(Math.random() * 40),
          supplier: ['Agric Supply Co.', 'Ghana Agro', 'Feed Masters'][Math.floor(Math.random() * 3)],
          recordedBy: 'Kofi',
        },
      })
    }

    // Create health checks
    for (let i = 0; i < 8; i++) {
      const date = new Date(now.getTime() - i * 4 * 24 * 60 * 60 * 1000)
      await db.healthCheck.create({
        data: {
          flockId: createdFlocks[Math.floor(Math.random() * createdFlocks.length)].id,
          farmId: [farm1.id, farm2.id, farm3.id][Math.floor(Math.random() * 3)],
          date: date.toISOString(),
          overallStatus: ['Good', 'Good', 'Fair', 'Poor'][Math.floor(Math.random() * 4)],
          symptoms: ['None', 'Mild coughing', 'Lethargy', 'Reduced feed intake'][Math.floor(Math.random() * 4)],
          temperature: 41 + Math.random() * 1,
          bodyCondition: ['Good', 'Good', 'Underweight'][Math.floor(Math.random() * 3)],
          vetOfficer: 'Dr. Mensah',
        },
      })
    }

    // Create vaccinations
    const vaccines = [
      { vaccineName: 'Newcastle Disease', method: 'Eye drop' },
      { vaccineName: 'Gumboro', method: 'Drinking water' },
      { vaccineName: 'Fowl Pox', method: 'Wing web puncture' },
      { vaccineName: 'Fowl Typhoid', method: 'Injection' },
      { vaccineName: 'Infectious Bronchitis', method: 'Drinking water' },
      { vaccineName: 'Newcastle Booster', method: 'Drinking water' },
      { vaccineName: 'Coryza', method: 'Injection' },
    ]

    for (const v of vaccines) {
      for (let fi = 0; fi < Math.min(3, createdFlocks.length); fi++) {
        const scheduledDate = new Date(now.getTime() + Math.floor(Math.random() * 20 - 5) * 24 * 60 * 60 * 1000)
        const isPast = scheduledDate < now
        const status = isPast
          ? (Math.random() > 0.3 ? 'Completed' : 'Overdue')
          : 'Scheduled'

        await db.vaccination.create({
          data: {
            flockId: createdFlocks[fi].id,
            farmId: createdFlocks[fi].farmId,
            vaccineName: v.vaccineName,
            scheduledDate: scheduledDate.toISOString(),
            administeredDate: status === 'Completed' ? scheduledDate.toISOString() : null,
            status,
            method: v.method,
            cost: Math.floor(Math.random() * 200) + 50,
            batchNo: `VAC${Math.floor(Math.random() * 9000) + 1000}`,
          },
        })
      }
    }

    // Create treatments
    for (let i = 0; i < 5; i++) {
      const date = new Date(now.getTime() - i * 6 * 24 * 60 * 60 * 1000)
      const farmForT = await db.farm.findFirst({ where: { name: 'Kumasi Main Farm' } })
      const flockForT = createdFlocks[Math.floor(Math.random() * createdFlocks.length)]
      await db.treatment.create({
        data: {
          flockId: flockForT.id,
          farmId: farmForT?.id || createdFlocks[0].farmId,
          date: date.toISOString(),
          diagnosis: ['Respiratory infection', 'Coccidiosis', 'Worm infestation', 'Egg drop syndrome', 'Heat stress'][i],
          medication: ['Oxytetracycline', 'Sulphadimidine', 'Piperazine', 'Vitamin supplement', 'Electrolytes'][i],
          dosage: 'As prescribed',
          duration: ['5 days', '3 days', '1 day', '7 days', '3 days'][i],
          cost: Math.floor(Math.random() * 500) + 100,
          vetOfficer: 'Dr. Mensah',
          status: 'Completed',
        },
      })
    }

    } // end of if (existingFarms === 0)

    // Seed staff accounts (always - idempotent check)
    if (existingStaff === 0) {
      const farm1Ref = await db.farm.findFirst({ where: { name: 'Kumasi Main Farm' } })
      await db.staff.create({ data: { name: 'CEO (Farm Owner)', role: 'CEO', username: 'ceo', password: 'ceo123', phone: '+233 24 123 4567' } })
      await db.staff.create({ data: { name: 'Kwame Asante', role: 'SALES', username: 'sales', password: 'sales123', phone: '+233 20 555 1000' } })
      await db.staff.create({ data: { name: 'Kofi Mensah', role: 'FARM_HAND', username: 'farmhand', password: 'farm123', phone: '+233 27 555 2000', farmId: farm1Ref?.id } })
      await db.staff.create({ data: { name: 'Akua Boateng', role: 'ACCOUNTANT', username: 'accountant', password: 'acc123', phone: '+233 24 555 3000' } })
      await db.staff.create({ data: { name: 'Dr. Yaw Mensah', role: 'VET', username: 'vet', password: 'vet123', phone: '+233 20 555 4000' } })
    }

    // Seed announcements (always - idempotent check)
    if (existingAnnouncements === 0) {
      await db.announcement.create({
        data: {
          title: 'Welcome to WAFT MAM Farms',
          message: 'This is your central farm management system. All daily records, reports and reminders can be found here. Contact the CEO if you need help.',
          priority: 'Normal',
          targetRoles: 'ALL',
          createdBy: 'ceo',
        },
      })
      await db.announcement.create({
        data: {
          title: 'Monthly Staff Meeting',
          message: 'There will be a monthly review meeting on the last Friday of every month at Kumasi Main Farm. All staff are expected to attend. Please prepare your farm reports.',
          priority: 'Important',
          targetRoles: 'ALL',
          createdBy: 'ceo',
        },
      })
      await db.announcement.create({
        data: {
          title: 'Feed Price Update',
          message: 'Layer mash price has increased to GHS 200 per 50kg bag effective from this week. Adjust all feed records accordingly.',
          priority: 'Urgent',
          targetRoles: 'FARM_HAND,ACCOUNTANT',
          createdBy: 'ceo',
        },
      })
    }

    return NextResponse.json({
      message: 'Sample data seeded successfully',
      staff: existingStaff > 0 ? existingStaff : 5,
      announcements: existingAnnouncements > 0 ? existingAnnouncements : 3,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
