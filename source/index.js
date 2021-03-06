const fs = require("fs");
const path = require("path");

const {defineStore} = require("@scriptabuild/eventstore");
const awaitable = require("@scriptabuild/awaitable");

const Stopwatch = require("./stopwatch");
const memberListModelDefinition = require("./memberList");
const allHistoricalMemberListModelDefinition = require("./allHistoricalMemberList");
const residensHistoryForMembersModelDefinition = require("./residenceHistoryForMembers");


const log = console.log;
(async function() {
    const folder = path.resolve(__dirname, "../temp");

    // Delete all logs and snapshots, create folder if neccesary
    try {
        (await awaitable(cb => fs.readdir(folder, cb))).forEach(async(filename) => {
            await awaitable(cb => fs.unlink(path.resolve(folder, filename), cb));
        });
    }
    catch (err) {
        // Do nothing, the logs are already deleted...
    }

	try{
        await awaitable(cb => fs.mkdir(folder, cb));		
	}
	catch(err){
		// ...
	}

    let store = await defineStore(folder);

    let currentMembers = store.defineModel(memberListModelDefinition);
    let allHistoricalMembers = store.defineModel(allHistoricalMemberListModelDefinition);
    let residensHistoryForMembers = store.defineModel(residensHistoryForMembersModelDefinition);


    await currentMembers.withReadWriteInstance((membersModel, readyToCommit) => {
        membersModel.registerNewMember({
            name: "Nina Hansen",
            address: {
                street: "Kirkeveien 271"
            },
            membershipLevel: "gold"
        });
        membersModel.registerNewMember({
            name: "Oskar Jensen",
            address: {
                street: "Store Ringvei 100"
            },
            membershipLevel: "silver"
        });
        membersModel.registerNewMember({
            name: "Kim Jamesson",
            address: {
                street: "Trondheimsveien 453"
            },
            membershipLevel: "bronze"
        });
        membersModel.registerNewMember({
            name: "Kari Kongsli",
            address: {
                street: "Trondheimsveien 453"
            },
            membershipLevel: "silver"
        });
        readyToCommit();
    });



    await currentMembers.withReadWriteInstance((memberModel, readyToCommit) => {
        memberModel.correctAddress("Kim Jamesson", {
            street: "Trondheimsveien 435"
        });
        readyToCommit();
    });



    await currentMembers.withReadWriteInstance((memberModel, readyToCommit) => {
        memberModel.endMembership("Kari Kongsli");
        readyToCommit();
    });



    await currentMembers.withReadWriteInstance((memberModel, readyToCommit) => {
        memberModel.memberHasMoved("Kim Jamesson", {
            street: "Bærumsveien 301"
        });
        readyToCommit();
    });



    await currentMembers.withReadWriteInstance((membersModel, readyToCommit) => {
        membersModel.registerNewMember({
            name: "Pernille Bråthen",
            address: {
                street: "Smetten 12"
            },
            membershipLevel: "silver"
        });
        membersModel.registerNewMember({
            name: "Karl Gudesen",
            address: {
                street: "Drammensveien 100"
            },
            membershipLevel: "blue"
        });
        readyToCommit();
    });



    await currentMembers.withReadWriteInstance((membersModel, readyToCommit) => {
        membersModel.listMembers().forEach(contact => log(contact.name));

        let ok = false;
        if (ok) readyToCommit();
    });

    console.log("---");

    await allHistoricalMembers.withReadInstance((historicalModel) => {
        historicalModel.listMembers().forEach(contact => log(`${contact.name} - ${contact.isMember}`));
    });

    console.log("---");

    await residensHistoryForMembers.withReadInstance((residensModel) => {
        residensModel.listMembers().forEach(contact => log(`${contact.name} - ${JSON.stringify(contact.residenses)}`));
    });


    console.log("--- Test total 15000 extra events in 1000 batches/transactions of 15 events each ---")

    let stopwatch = Stopwatch.start();
    console.log("*** before loop", stopwatch.elapsed());
    for (let j = 0; j < 1000; j++) {
        await currentMembers.withReadWriteInstance((membersModel, readyToCommit) => {
            for (let i = 0; i < 10; i++) {
                membersModel.registerNewMember({
                    name: `Test${i} Testesen${j}`,
                    address: {
                        street: "Kirkeveien 271"
                    },
                    membershipLevel: "gold"
                });
            }
            for (let i = 3; i < 8; i++) {
                membersModel.endMembership(`Test${i} Testesen${j}`)
            }
            readyToCommit();
        });
    }

    console.log("*** after loop", stopwatch.elapsed(true));

    // await residensHistoryForMembers.snapshot();
    // console.log("*** after snapshot of readmodel", stopwatch.elapsed(true));
    await residensHistoryForMembers.withReadInstance((residensModel) => {
        console.log("Number of rows", residensModel.listMembers().length);
    });
    console.log("*** after read model", stopwatch.elapsed(true));
})();